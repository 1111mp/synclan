import { createContext, useContext, type ReactNode } from 'react';

import { useSocketIO, type ReadyState, type SendMessage } from '@/hooks';
import { WS_URL } from '@/lib/constant';
import { useDeviceStore, useIMStore, useMessageAnimationStore } from '@/stores';

type AppContext = {
  socketState: ReadyState;
  sendMessage: SendMessage;
};

export const AppContext = createContext<AppContext | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const current = useDeviceStore((s) => s.current);
  const addMessage = useIMStore((s) => s.addMessage);

  const { state: socketState, sendMessage } = useSocketIO(WS_URL, {
    transports: ['websocket'],
    auth: {
      deviceId: current?.id,
    },
    onMessage(message) {
      if (!current?.id) return;
      useMessageAnimationStore.getState().add(message.uuid);
      addMessage(message.sender, message, current.id);
    },
  });

  return (
    <AppContext value={{ socketState, sendMessage }}>{children}</AppContext>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    // this is especially useful in TypeScript so you don't need to be checking for null all the time
    throw new Error(
      'You have forgot to use AppContext.Provider, shame on you.',
    );
  }
  return context;
}
