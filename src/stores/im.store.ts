import omit from 'lodash-es/omit';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

import { isSameDay, THRESHOLD } from '@/components/messages/util';
import { db } from '@/lib/db';
import {
  getDeviceById,
  getOfflineMsgsSummary,
  updateMsgAck,
} from '@/services/cmd';

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
  addConversations: (incomingDevices: IDevice[]) => void;
  updateConvsFromOffline: (receiver: string) => Promise<void>;
  setActiveConversation: (id: string, device?: IDevice) => void;
  exitConversation: () => void;
  deleteConversation: (id: string) => void;
  syncDeviceInfo: (id: string) => void;

  setHistory: (deviceId: string, msgs: IMessage[]) => void;
  addMessage: (deviceId: string, msg: IMessage, currentId: string) => void;
  addMessages: (deviceId: string, msgs: IMessage[], currentId: string) => void;
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
  deleteMessage: (deviceId: string, msgId: string) => void;
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
      updateConvsFromOffline: async (receiver) => {
        const summary = await getOfflineMsgsSummary(receiver);
        if (!summary) return;

        const activeId = get().activeDeviceId;
        const now = Date.now();

        let lastAck: number | null = null;

        for (const [deviceId, deviceSummary] of Object.entries(summary)) {
          const { total = 0, lastMsg } = deviceSummary;
          if (total <= 0 || !lastMsg) continue;

          if (lastMsg.id && (lastAck === null || lastMsg.id > lastAck)) {
            lastAck = lastMsg.id;
          }

          const isCurrentActive = activeId === deviceId;
          const existingConv = get().conversations.has(deviceId);
          if (existingConv) {
            set((state) => {
              const conv = state.conversations.get(deviceId)!;
              conv.lastAccessed = now;
              conv.lastMessage = toLastMessage(lastMsg);
              // 如果不是当前处于激活状态的聊天框，累加未读数
              if (!isCurrentActive) {
                conv.unreadCount += total;
              }
            });
          } else {
            const device = await getDeviceById(deviceId);
            set((state) => {
              const initialUnreadCount = !isCurrentActive ? total : 0;
              state.conversations.set(deviceId, {
                id: deviceId,
                device,
                unreadCount: initialUnreadCount,
                lastAccessed: now,
                lastMessage: toLastMessage(lastMsg),
              });
            });
          }
        }
        // TODO update lastest ack
        if (lastAck) {
          await updateMsgAck({ receiver, lastAck });
        }
      },
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
      exitConversation: () => {
        set((state) => {
          state.activeDeviceId = '';
        });
      },
      deleteConversation: (id) => {
        set((state) => {
          state.conversations.delete(id);
          if (id === state.activeDeviceId) {
            state.activeDeviceId = '';
          }
        });
      },
      syncDeviceInfo: async (id) => {
        const existingConv = get().conversations.has(id);
        if (existingConv) {
          const device = await getDeviceById(id);
          set((state) => {
            const conv = state.conversations.get(id)!;
            conv.device = device;
          });
        }
      },
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
          conv.unreadCount = 0;

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
          cache.order = Array.from(new Set([...newUuids, ...cache.order]));
          // cache.order = [...newUuids, ...cache.order];

          if (cache.order.length > 0) {
            const lastMsgId = cache.order[cache.order.length - 1];
            const lastMsg = cache.messages.get(lastMsgId);
            if (lastMsg) {
              conv.lastMessage = toLastMessage(lastMsg);
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
              lastMessage: toLastMessage(msg),
            });

            // 2. 更新消息详情缓存（如果该会话目前在 10 个缓存名额中）
            const cache = state.messageCaches.get(deviceId);
            if (cache) {
              if (cache.messages.get(msg.uuid)) return;
              // 情况 1：缓存存在，直接追加
              cache.messages.set(msg.uuid, msg);
              cache.order.push(msg.uuid);
            } else {
              // 情况 2：缓存不存在（不管是当前激活的，还是后台新来的）
              // 建立新缓存
              state.messageCaches.set(deviceId, {
                messages: new Map([[msg.uuid, msg]]),
                order: [msg.uuid],
                hydrated: false,
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
          conv.lastMessage = toLastMessage(msg);

          // 2. 更新消息详情缓存（如果该会话目前在 10 个缓存名额中）
          const cache = state.messageCaches.get(deviceId);
          if (cache) {
            if (cache.messages.has(msg.uuid)) return;
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

          // 🔥 未读数计数逻辑：如果不是当前激活的会话，且是别人发的消息，未读数 +1
          if (!isCurrentActive && isFromOthers) {
            conv.unreadCount += 1;
          }
        });
      },
      addMessages: async (deviceId, msgs, currentId) => {
        const isCurrentActive = get().activeDeviceId === deviceId;
        // const isFromOthers = msg.sender !== currentId;

        let conv = get().conversations.get(deviceId);
        if (!conv) {
          const device = await getDeviceById(deviceId);
          set((state) => {
            const now = Date.now();

            // const initialUnreadCount = !isCurrentActive && isFromOthers ? 1 : 0;

            const unreadCount = msgs.reduce((count, msg) => {
              return !isCurrentActive && msg.sender !== currentId
                ? count + 1
                : count;
            }, 0);

            state.conversations.set(deviceId, {
              id: deviceId,
              device,
              unreadCount: unreadCount,
              lastAccessed: now,
              lastMessage: toLastMessage(msgs[msgs.length - 1]),
            });

            // 2. 更新消息详情缓存（如果该会话目前在 10 个缓存名额中）
            const cache = state.messageCaches.get(deviceId);

            if (cache) {
              for (const msg of msgs) {
                if (cache.messages.get(msg.uuid)) continue;
                // 情况 1：缓存存在，直接追加
                cache.messages.set(msg.uuid, msg);
                cache.order.push(msg.uuid);
              }
            } else {
              // 情况 2：缓存不存在（不管是当前激活的，还是后台新来的）
              const messages = new Map<string, (typeof msgs)[number]>();
              const order: string[] = [];
              for (const msg of msgs) {
                if (messages.has(msg.uuid)) continue;

                messages.set(msg.uuid, msg);
                order.push(msg.uuid);
              }
              // 建立新缓存
              state.messageCaches.set(deviceId, {
                messages,
                order,
                hydrated: false,
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
          conv.lastMessage = toLastMessage(msgs[msgs.length - 1]);

          // 2. 更新消息详情缓存（如果该会话目前在 10 个缓存名额中）
          const cache = state.messageCaches.get(deviceId);

          if (cache) {
            for (const msg of msgs) {
              if (cache.messages.has(msg.uuid)) continue;
              // 情况 1：缓存存在，直接追加
              cache.messages.set(msg.uuid, msg);
              cache.order.push(msg.uuid);
            }
          } else {
            // 情况 2：缓存不存在（不管是当前激活的，还是后台新来的）
            const messages = new Map<string, (typeof msgs)[number]>();
            const order: string[] = [];
            for (const msg of msgs) {
              if (messages.has(msg.uuid)) continue;

              messages.set(msg.uuid, msg);
              order.push(msg.uuid);
            }
            // 建立新缓存
            state.messageCaches.set(deviceId, {
              messages,
              order,
              hydrated: isCurrentActive,
              loadingHistory: false,
            });

            evictOldestMessageCaches(
              state.messageCaches,
              state.activeDeviceId,
              state.conversations,
            );
          }

          // 🔥 未读数计数逻辑：如果不是当前激活的会话，且是别人发的消息，未读数 +1
          if (!isCurrentActive) {
            conv.unreadCount += msgs.filter(
              (msg) => msg.sender !== currentId,
            ).length;
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
            conv.lastMessage = toLastMessage(msg);
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
            conv.lastMessage = toLastMessage(msg);
          }
        }),
      deleteMessage: (deviceId, msgId) => {
        set((state) => {
          const cache = state.messageCaches.get(deviceId);
          if (!cache) return;

          const msg = cache.messages.get(msgId);
          if (!msg) return;

          cache.messages.delete(msgId);
          const index = cache.order.indexOf(msgId);
          if (index !== -1) {
            cache.order.splice(index, 1);
          }

          const conv = state.conversations.get(deviceId);
          if (!conv) return;

          if (conv.lastMessage?.uuid === msgId) {
            const lastUuid = cache.order[cache.order.length - 1];

            conv.lastMessage = lastUuid
              ? toLastMessage(cache.messages.get(lastUuid))
              : undefined;
          }
        });
      },
    })),
  ),
);

// 记录上一次的 keys，用来比对哪些被删除了
let prevKeys = new Set<string>();

useIMStore.subscribe(
  (state) => state.conversations,
  async (conversations) => {
    const currentKeys = new Set(conversations.keys());

    // 1. 找出被删除的 ID (存在于上一次，但不存在于这一次)
    prevKeys.forEach((oldId) => {
      if (!currentKeys.has(oldId)) {
        void db.conversations.delete(oldId);
      }
    });

    // 2. 更新/写入现有的 ID
    conversations.forEach((conv) => {
      void db.conversations.put({
        id: conv.id,
        device: conv.device,
        unreadCount: conv.unreadCount,
        lastAccessed: conv.lastAccessed,
        lastMessage: conv.lastMessage,
      });
    });

    // 3. 记住当前的 keys，供下一次对比
    prevKeys = currentKeys;
  },
  { fireImmediately: true },
);

export const useConversationList = () => {
  return useIMStore(
    useShallow((state) => {
      return Array.from(state.conversations.values()).sort((a, b) => {
        const timeA = a.lastMessage?.updatedAt ?? a.lastAccessed ?? 0;
        const timeB = b.lastMessage?.updatedAt ?? b.lastAccessed ?? 0;
        return timeB - timeA;
      });
    }),
  );
};

export const useCurrentConversation = () => {
  return useIMStore(
    useShallow((state) => {
      return state.conversations.get(state.activeDeviceId);
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

export function getMessagesWithTimestamp(cache: IMDeviceState) {
  if (!cache?.order.length) return [];

  const messages = cache.order.map((id) => cache.messages.get(id)!);
  const result: IUIMessage[] = [];
  let lastTimestampTime: number | undefined = undefined;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const preMsg = i > 0 ? messages[i - 1] : undefined;

    let showTimestamp = false;

    if (!preMsg) {
      showTimestamp = true;
    } else if (!isSameDay(msg.createdAt, preMsg.createdAt)) {
      showTimestamp = true;
    } else if (lastTimestampTime !== undefined) {
      if (lastTimestampTime - preMsg.createdAt > THRESHOLD) {
        showTimestamp = true;
      }
    } else if (msg.createdAt - preMsg.createdAt > THRESHOLD) {
      showTimestamp = true;
    }

    if (showTimestamp) {
      lastTimestampTime = msg.createdAt;
    }

    result[i] = {
      ...msg,
      showTimestamp,
    } as IUIMessage;
  }

  return result;
}

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

export function toLastMessage(msg?: IMessage): LastMessage | undefined {
  if (!msg) return undefined;
  return omit(msg, ['content']);
}
