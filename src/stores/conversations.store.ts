import { createStore, useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { IMessage } from '@/lib/types';

type Conversation = {
  id: string;
  lastMessage: IMessage | null;
  unreadCount: number;
  updatedAt: number;
  createdAt: number;
};

export type ConversationsStore = {
  actived: string | null;
  messages: Array<IMessage>;
  conversations: Array<Conversation>;
  updateActived: (id: string | null) => void;
};

const store = createStore<ConversationsStore>()(
  immer((set) => ({
    actived: null,
    conversations: [],
    messages: [],
    updateActived: (id: string | null) =>
      set((state) => {
        state.actived = id;
      }),
  })),
);

export function useConversationsStore() {
  const { actived, conversations, updateActived } = useStore(
    store,
    (state) => ({
      actived: state.actived,
      conversations: state.conversations,
      updateActived: state.updateActived,
    }),
  );

  return {
    actived,
    conversations,
    updateActived,
  };
}

export function useMessagesStore() {
  const { messages } = useStore(store, (state) => ({
    messages: state.messages,
  }));

  return {
    messages,
  };
}
