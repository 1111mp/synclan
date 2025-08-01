import { createContext, useContext, type ReactNode } from 'react';
import { useSocketIO, type ReadyState, type SendMessage } from './hooks';

type AppContext = {
  socketState: ReadyState;
  sendMessage: SendMessage;
};

export const AppContext = createContext<AppContext | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { state: socketState, sendMessage } = useSocketIO(
    'ws://10.97.87.45:53317/socket',
    {
      transports: ['websocket'],
      onMessage(message) {
        console.log('Received message:', message);
      },
    },
  );

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
