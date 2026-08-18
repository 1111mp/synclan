import { useCallback, useEffect, useRef, useState } from 'react';
import type { ManagerOptions, Socket, SocketOptions } from 'socket.io-client';
import { io as SocketIO } from 'socket.io-client';

import { HttpStatus } from '@/lib/types';

export enum ReadyState {
  UNINSTANTIATED = -1,
  CONNECTING = 0,
  CONNECTED = 1,
  DISCONNECT = 2,
  CLOSED = 3,
}

export enum EventNames {
  MESSAGE = 'synclan://message',
  MESSAGEREAD = 'synclan://message:read',
}

type AckResponse<T> = {
  statusCode: HttpStatus;
  message?: string;
  data?: T;
};

type ListenEvents = Record<
  EventNames,
  (message: IMessage, cb: (resp: AckResponse<unknown>) => void) => void
>;
type EmitEvents = Record<
  EventNames,
  (message: IMessage, cb: (resp: AckResponse<IMessage>) => void) => void
>;

export type UseSocketOptions = Partial<
  ManagerOptions &
    SocketOptions & {
      onMessage: (message: IMessage) => void;
    }
>;

export type SendMessage = (
  message: IMessage,
  timeout?: number,
) => Promise<AckResponse<IMessage>>;

export function useSocketIO(url: string, options: UseSocketOptions = {}) {
  const [state, setState] = useState<ReadyState>(
    () => ReadyState.UNINSTANTIATED,
  );

  const socketRef = useRef<Socket<ListenEvents, EmitEvents>>(null);
  const urlRef = useRef<string | null>(null);
  const optionsRef = useRef<UseSocketOptions>(options);
  urlRef.current = url;
  optionsRef.current = options;

  useEffect(() => {
    if (!urlRef.current) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = SocketIO(urlRef.current, optionsRef.current);
    socketRef.current = socket;
    setState(ReadyState.CONNECTING);

    function onConnect() {
      setState(ReadyState.CONNECTED);
    }

    function onDisconnect() {
      setState(ReadyState.DISCONNECT);
    }

    function recoverFromPageResume() {
      if (document.visibilityState !== 'visible') return;

      // Mobile browsers may suspend a page while retaining a stale WebSocket.
      // Recreate it when the page becomes active so the server records the
      // current socket instead of delivering to the suspended one.
      socket.disconnect();
      socket.connect();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    document.addEventListener('visibilitychange', recoverFromPageResume);
    window.addEventListener('online', recoverFromPageResume);

    let onMessage: EmitEvents[EventNames.MESSAGE];
    if (optionsRef.current?.onMessage) {
      onMessage = (message, callback) => {
        optionsRef.current.onMessage?.(message);
        callback({
          statusCode: HttpStatus.OK,
          message: 'successed',
        });
      };
      socket.on(EventNames.MESSAGE, onMessage);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      document.removeEventListener('visibilitychange', recoverFromPageResume);
      window.removeEventListener('online', recoverFromPageResume);

      if (optionsRef.current?.onMessage && onMessage) {
        socket.off(EventNames.MESSAGE, onMessage);
      }

      socket.close();
      socketRef.current = null;
    };
  }, []);

  const sendMessage = useCallback<SendMessage>(
    (
      message: IMessage,
      timeout: number = 10000, // Message sending timeout (millisecond)
    ): Promise<AckResponse<IMessage>> => {
      return new Promise((resolve, reject) => {
        if (socketRef.current?.connected) {
          socketRef.current
            .timeout(timeout)
            .emit(EventNames.MESSAGE, message, (err, resp) => {
              if (err) {
                return reject({
                  statusCode: HttpStatus.REQUEST_TIMEOUT,
                  message: 'timeout',
                });
              }

              if (resp.statusCode !== HttpStatus.OK) {
                return reject(resp);
              }

              resolve(resp);
            });
          return;
        }
        reject({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'not connected',
        });
      });
    },
    [],
  );

  return {
    state,
    sendMessage,
  };
}
