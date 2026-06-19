import { createContext, useContext, type ReactNode } from 'react';

import { useSocketIO, type ReadyState, type SendMessage } from '@/hooks';
import { WS_URL } from '@/lib/constant';
import { useDeviceStore } from '@/stores';

type AppContext = {
  socketState: ReadyState;
  sendMessage: SendMessage;
};

export const AppContext = createContext<AppContext | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const device = useDeviceStore((s) => s.current);

  const { state: socketState, sendMessage } = useSocketIO(WS_URL, {
    transports: ['websocket'],
    auth: {
      deviceId: device?.id,
    },
    onMessage(message) {
      console.log('Received message:', message);
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
