import { useCallback, useEffect, useRef, useState } from 'react';
import type { ManagerOptions, Socket, SocketOptions } from 'socket.io-client';
import { io as SocketIO } from 'socket.io-client';

import { HttpStatus, type IMessage } from '@/lib/types';

export enum ReadyState {
  UNINSTANTIATED = -1,
  CONNECTING = 0,
  CONNECTED = 1,
  DISCONNECT = 2,
  CLOSED = 3,
}

export enum EventNames {
  MESSAGE = 'on-message',
  MESSAGEREAD = 'on-message:read',
}

type AckResponse = {
  statusCode: HttpStatus;
  message?: string;
};

type ListenEvents = Record<
  EventNames,
  (message: IMessage, cb: (resp: AckResponse) => void) => void
>;
type EmitEvents = Record<
  EventNames,
  (message: IMessage, cb: (resp: AckResponse) => void) => void
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
) => Promise<AckResponse>;

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

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    let onMessage: EmitEvents[EventNames.MESSAGE];
    if (optionsRef.current?.onMessage) {
      onMessage = (message, callback) => {
        optionsRef.current.onMessage?.(message);
        callback({
          statusCode: HttpStatus.OK,
          message: 'successed',
        });
      };
      socket.on('on-message', onMessage);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);

      if (optionsRef.current?.onMessage && onMessage) {
        socket.off('on-message', onMessage);
      }

      socket.close();
      socketRef.current = null;
    };
  }, []);

  const sendMessage = useCallback<SendMessage>(
    (
      message: IMessage,
      timeout: number = 10000, // Message sending timeout (millisecond)
    ): Promise<AckResponse> => {
      return new Promise((resolve, reject) => {
        if (socketRef.current?.connected) {
          socketRef.current
            .timeout(timeout)
            .emit(EventNames.MESSAGE, message, (err, resp) => {
              if (err) {
                reject({
                  statusCode: HttpStatus.REQUEST_TIMEOUT,
                  message: 'timeout',
                });
              }

              resolve(resp);
            });
        }
        // TODO push messages quene
      });
    },
    [],
  );

  return {
    state,
    sendMessage,
  };
}
