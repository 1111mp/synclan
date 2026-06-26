import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

import { db } from '@/lib/db';
import { getDeviceById } from '@/services/cmd';

enableMapSet();

const MAX_CACHED_IM_DEVICESS = 10;

type IMDeviceState = {
  messages: Map<string, IMessage>;
  order: string[];

  hydrated: boolean;
  loadingHistory: boolean;
};

type IMState = {
  // states
  activeDeviceId: string;
  conversations: Map<string, IConversations>;
  messageCaches: Map<string, IMDeviceState>;

  // actions
  hydrateConversations: () => Promise<void>;
  // initConversations: (id: string) => void;
  addConversations: (incomingDevices: IDevice[]) => void;

  setActiveConversation: (id: string, device?: IDevice) => void;
  setHistory: (deviceId: string, msgs: IMessage[]) => void;
  addMessage: (deviceId: string, msg: IMessage, currentId: string) => void;
  updateMessage: (
    deviceId: string,
    msgId: string,
    patch: Partial<IMessage>,
  ) => void;
  // markAsFailed: (conversationId: string, messageId: string) => void;
  reconcileServerMessage: (
    deviceId: string,
    uuid: string,
    serverMsg: IMessage,
  ) => void;
};

export const useIMStore = create<IMState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      activeDeviceId: '',
      conversations: new Map(),
      messageCaches: new Map(),

      hydrateConversations: async () => {
        const savedList = await db.conversations
          .orderBy('lastAccessed')
          .reverse()
          .toArray();
        if (savedList.length > 0) {
          set((state) => {
            savedList.forEach((conv) => {
              state.conversations.set(conv.id, conv);
            });
          });
        }
      },
      // initConversations: (id) =>
      //   set((state) => {
      //     if (!state.conversations.has(id)) {
      //       state.conversations.set(id, {
      //         id,
      //         unreadCount: 0,
      //         lastAccessed: Date.now(),
      //       });
      //     }
      //   }),
      addConversations: (incomingDevices) =>
        set((state) => {
          const now = Date.now();
          incomingDevices.forEach((dev) => {
            const existing = state.conversations.get(dev.id);
            if (!existing) {
              state.conversations.set(dev.id, {
                id: dev.id,
                device: dev,
                unreadCount: 0,
                lastAccessed: now,
              });
            }
          });
        }),
      setActiveConversation: (id, device) =>
        set((state) => {
          state.activeDeviceId = id;

          const now = Date.now();
          let conv = state.conversations.get(id);
          if (!conv) {
            conv = { id, device, unreadCount: 0, lastAccessed: now };
            state.conversations.set(id, conv);
          } else {
            conv.lastAccessed = now;
            conv.unreadCount = 0;
          }

          if (!state.messageCaches.has(id)) {
            state.messageCaches.set(id, {
              messages: new Map(),
              order: [],
              hydrated: false,
              loadingHistory: false,
            });
            evictOldestMessageCaches(
              state.messageCaches,
              state.activeDeviceId,
              state.conversations,
            );
          }
        }),
      setHistory: (deviceId, msgs) =>
        set((state) => {
          const now = Date.now();

          let conv = state.conversations.get(deviceId);
          if (!conv) return;
          // if (!conv) {
          //   conv = { id: deviceId, unreadCount: 0, lastAccessed: now };
          //   state.conversations.set(deviceId, conv);
          // }

          conv.lastAccessed = now;

          let cache = state.messageCaches.get(deviceId);
          if (!cache) {
            cache = {
              messages: new Map(),
              order: [],
              hydrated: false,
              loadingHistory: false,
            };
            state.messageCaches.set(deviceId, cache);
            evictOldestMessageCaches(
              state.messageCaches,
              state.activeDeviceId,
              state.conversations,
            );
          }

          cache.loadingHistory = true;

          const newUuids: string[] = [];
          for (const msg of msgs) {
            if (!cache.messages.has(msg.uuid)) {
              cache.messages.set(msg.uuid, msg);
              newUuids.push(msg.uuid);
            }
          }
          cache.order = [...newUuids, ...cache.order];

          if (cache.order.length > 0) {
            const lastMsgId = cache.order[cache.order.length - 1];
            const lastMsg = cache.messages.get(lastMsgId);
            if (lastMsg) {
              conv.lastMessage = lastMsg;
            }
          }

          cache.hydrated = true;
          cache.loadingHistory = false;
        }),
      addMessage: async (deviceId, msg, currentId) => {
        const isCurrentActive = get().activeDeviceId === deviceId;
        const isFromOthers = msg.sender !== currentId;

        let conv = get().conversations.get(deviceId);
        if (!conv) {
          const device = await getDeviceById(deviceId);
          set((state) => {
            const now = Date.now();
            const initialUnreadCount = !isCurrentActive && isFromOthers ? 1 : 0;
            state.conversations.set(deviceId, {
              id: deviceId,
              device,
              unreadCount: initialUnreadCount,
              lastAccessed: now,
              lastMessage: msg,
            });

            // 2. 更新消息详情缓存（如果该会话目前在 10 个缓存名额中）
            const cache = state.messageCaches.get(deviceId);
            if (cache) {
              // 情况 1：缓存存在，直接追加
              cache.messages.set(msg.uuid, msg);
              cache.order.push(msg.uuid);
            } else {
              // 情况 2：缓存不存在（不管是当前激活的，还是后台新来的）
              // 建立新缓存
              state.messageCaches.set(deviceId, {
                messages: new Map([[msg.uuid, msg]]),
                order: [msg.uuid],
                hydrated: true,
                loadingHistory: false,
              });
              evictOldestMessageCaches(
                state.messageCaches,
                state.activeDeviceId,
                state.conversations,
              );
            }
          });
          return;
        }

        set((state) => {
          const now = Date.now();
          let conv = state.conversations.get(deviceId);
          if (!conv) return;

          conv.lastAccessed = now;
          conv.lastMessage = msg;

          // 🔥 未读数计数逻辑：如果不是当前激活的会话，且是别人发的消息，未读数 +1
          if (!isCurrentActive && isFromOthers) {
            conv.unreadCount += 1;
          }

          // 2. 更新消息详情缓存（如果该会话目前在 10 个缓存名额中）
          const cache = state.messageCaches.get(deviceId);
          if (cache) {
            // 情况 1：缓存存在，直接追加
            cache.messages.set(msg.uuid, msg);
            cache.order.push(msg.uuid);
          } else {
            // 情况 2：缓存不存在（不管是当前激活的，还是后台新来的）
            // 建立新缓存
            state.messageCaches.set(deviceId, {
              messages: new Map([[msg.uuid, msg]]),
              order: [msg.uuid],
              hydrated: isCurrentActive,
              loadingHistory: false,
            });
            evictOldestMessageCaches(
              state.messageCaches,
              state.activeDeviceId,
              state.conversations,
            );
          }
        });
      },
      updateMessage: (deviceId, msgId, patch) =>
        set((state) => {
          const cache = state.messageCaches.get(deviceId);
          const msg = cache?.messages.get(msgId);
          if (!msg) return;

          Object.assign(msg, patch);

          // 如果修改的是最后一条消息的内容，同步更新会话列表元数据
          const conv = state.conversations.get(deviceId);
          if (conv?.lastMessage?.uuid === msgId) {
            conv.lastMessage = msg;
          }
        }),
      reconcileServerMessage: (deviceId, uuid, serverMsg) =>
        set((state) => {
          const cache = state.messageCaches.get(deviceId);
          const msg = cache?.messages.get(uuid);
          if (!msg) return;

          Object.assign(msg, serverMsg);

          // 同步更新会话元数据
          const conv = state.conversations.get(deviceId);
          if (conv?.lastMessage?.uuid === uuid) {
            conv.lastMessage = msg;
          }
        }),
    })),
  ),
);

useIMStore.subscribe(
  (state) => state.conversations,
  (conversations) => {
    // 每次 Zustand 里的会话发生变化（新消息、未读变动），批量增量写入 IndexedDB
    conversations.forEach((conv) => {
      void db.conversations.put({
        id: conv.id,
        device: conv.device,
        unreadCount: conv.unreadCount,
        lastAccessed: conv.lastAccessed,
        lastMessage: conv.lastMessage,
      });
    });
  },
);

export const useConversationList = () => {
  return useIMStore(
    useShallow((state) => {
      return Array.from(state.conversations.values()).sort(
        (a, b) => b.lastAccessed - a.lastAccessed,
      );
    }),
  );
};

export const useTotalUnreadCount = () => {
  return useIMStore((state) => {
    return Array.from(state.conversations.values()).reduce(
      (sum, conv) => sum + conv.unreadCount,
      0,
    );
  });
};

function evictOldestMessageCaches(
  caches: Map<string, IMDeviceState>,
  activeId: string,
  conversations: Map<string, IConversations>,
) {
  if (caches.size <= MAX_CACHED_IM_DEVICESS) return;

  let oldestId: string | null = null;
  let oldestTime = Infinity;

  for (const id of caches.keys()) {
    if (id === activeId) continue;

    const conv = conversations.get(id);
    const lastTime = conv ? conv.lastAccessed : 0;
    if (lastTime < oldestTime) {
      oldestTime = lastTime;
      oldestId = id;
    }
  }

  // release memory
  if (oldestId) {
    caches.delete(oldestId);
  }
}
