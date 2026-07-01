import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { InView } from 'react-intersection-observer';
import { useParams } from 'react-router';
import { useMeasure } from 'react-use';
import { v4 as uuidv4 } from 'uuid';
import { useShallow } from 'zustand/react/shallow';

import { useAppContext } from '@/app-context';
import { MessageWrapper, Transmitter } from '@/components';
import { Toaster } from '@/components/ui';
import { HttpStatus } from '@/lib/types';
import { getMessages } from '@/services/cmd';
import { useDeviceStore, useIMStore } from '@/stores';

function loader() {}

function DevicesPage() {
  const [didInitialScroll, setDidInitialScroll] = useState<boolean>(false);

  const params = useParams();

  const mounted = useRef<boolean>(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const latestMessageInViewRef = useRef<boolean>(false);
  const isFetching = useRef<boolean>(false);
  const [footerRef, { height: footerHeight }] = useMeasure<HTMLElement>();

  const { sendMessage } = useAppContext();

  const current = useDeviceStore((s) => s.current);
  const isHydrated = useIMStore(
    useCallback(
      (s) => s.messageCaches.get(params.id || '')?.hydrated ?? false,
      [params.id],
    ),
  );
  const addMessage = useIMStore((s) => s.addMessage);
  const setActiveConversation = useIMStore((s) => s.setActiveConversation);
  const reconcileServerMessage = useIMStore((s) => s.reconcileServerMessage);

  const {
    // status,
    data: queryData,
    // error,
    // isFetching,
    // isFetchingNextPage,
    isFetchingPreviousPage,
    // hasNextPage,
    hasPreviousPage,
    // fetchNextPage,
    fetchPreviousPage,
  } = useInfiniteQuery({
    queryKey: ['messages', params.id],
    // 首次进入没有 last_id，传 undefined
    initialPageParam: undefined as number | undefined,
    refetchOnWindowFocus: false,
    queryFn: ({ pageParam }) =>
      getMessages({
        selfId: current?.id || '',
        targetId: params.id || '',
        lastId: pageParam,
        pageSize: 20,
      }),
    getPreviousPageParam: (firstPage) => firstPage.nextCursor,
    getNextPageParam: () => undefined,
    enabled: !!params.id && !!current?.id && !isHydrated,
  });

  useEffect(() => {
    if (queryData?.pages && queryData.pages.length > 0) {
      const lastPage = queryData.pages[0];
      if (lastPage.data && lastPage.data.length > 0) {
        useIMStore.getState().setHistory(params.id!, lastPage.data);
      }
    }
  }, [queryData?.pages, params.id]);

  const messages = useIMStore(
    useShallow((s) => {
      const messageCache = s.messageCaches.get(params.id!);
      if (!messageCache) return [];
      return messageCache.order.map((id) => messageCache.messages.get(id)!);
    }),
  );

  const virtualizer = useVirtualizer({
    count: messages.length,
    overscan: 6,
    // paddingStart: 12,
    paddingEnd: footerHeight + 16,
    // gap: 12,
    estimateSize: () => 74,
    getScrollElement: () => parentRef.current,
    getItemKey: useCallback(
      (index: number) => messages[index]!.uuid,
      [messages],
    ),
    anchorTo: 'end',
    followOnAppend: true,
    scrollEndThreshold: 120,
    directDomUpdates: true,
  });

  useEffect(() => {
    if (!params.id || mounted.current) return;
    setActiveConversation(params.id);
  }, [params.id, setActiveConversation]);

  useLayoutEffect(() => {
    if (didInitialScroll) return;
    mounted.current = true;
    virtualizer.scrollToEnd();
    setDidInitialScroll(true);
  }, [didInitialScroll, virtualizer]);

  useEffect(() => {
    if (footerHeight <= 46 || !latestMessageInViewRef.current) return;

    virtualizer.scrollToEnd({ behavior: 'smooth' });
  }, [footerHeight, virtualizer]);

  const onSend = async (content: string) => {
    const deviceId = params.id;
    if (!content.trim() || !deviceId || !current) return;

    const now = Date.now();
    const message: IMessage = {
      uuid: uuidv4(),
      type: 'text',
      sender: current.id,
      receiver: deviceId,
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    };
    addMessage(deviceId, message, current.id);

    try {
      const result = await sendMessage(message);
      if (result.statusCode === HttpStatus.OK && result.data) {
        reconcileServerMessage(deviceId, message.uuid, result.data);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      className='flex flex-col overflow-hidden'
      style={{
        height: 'calc(100vh - 64px)',
      }}
    >
      <div
        ref={parentRef}
        className='min-h-0 w-full overflow-x-hidden overflow-y-auto'
        onScroll={(event) => {
          if (
            !mounted.current ||
            virtualizer.isAtEnd(80) ||
            isFetchingPreviousPage ||
            !hasPreviousPage ||
            isFetching.current
          )
            return;

          if (
            event.currentTarget &&
            (event.currentTarget as HTMLElement).scrollTop < 120
          ) {
            isFetching.current = true;
            void fetchPreviousPage().finally(() => {
              setTimeout(() => {
                isFetching.current = false;
              }, 300);
            });
          }
        }}
      >
        <div ref={virtualizer.containerRef} className='relative w-full'>
          {virtualItems.map((virtualItem) => {
            const message = messages[virtualItem.index],
              previousMessage = messages[virtualItem.index - 1] || void 0,
              right = message.sender === current?.id,
              isLatest = virtualItem.index === messages.length - 1;

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className='absolute top-0 left-0 w-full'
              >
                {isLatest ? (
                  <InView
                    as='div'
                    onChange={(inView) => {
                      latestMessageInViewRef.current = inView;
                    }}
                  >
                    <MessageWrapper
                      message={message}
                      previousMessage={previousMessage}
                      position={right ? 'right' : 'left'}
                    />
                  </InView>
                ) : (
                  <MessageWrapper
                    message={message}
                    previousMessage={previousMessage}
                    position={right ? 'right' : 'left'}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <footer
        ref={footerRef}
        className='footer-gradient absolute bottom-0 w-full shrink-0 pr-4 pb-2 pl-2'
      >
        <Transmitter onSend={onSend} />
      </footer>
      <Toaster />
    </div>
  );
}

export { DevicesPage as Component, loader };
