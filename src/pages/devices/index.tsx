import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ClickScrollPlugin,
  OverlayScrollbars,
  ScrollbarsHidingPlugin,
  SizeObserverPlugin,
} from 'overlayscrollbars';
import {
  OverlayScrollbarsComponent,
  type OverlayScrollbarsComponentRef,
} from 'overlayscrollbars-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { InView } from 'react-intersection-observer';

import 'overlayscrollbars/overlayscrollbars.css';
import { useParams } from 'react-router';
import { useMeasure } from 'react-use';
import { v4 as uuidv4 } from 'uuid';
import { useShallow } from 'zustand/react/shallow';

import { useAppContext } from '@/app-context';
import { MessageWrapper, Transmitter } from '@/components';
import { Toaster } from '@/components/ui';
import { HttpStatus } from '@/lib/types';
import { getMessages } from '@/services/cmd';
import { useDeviceStore, useIMStore, useSynclanStore } from '@/stores';

OverlayScrollbars.plugin([
  ScrollbarsHidingPlugin,
  SizeObserverPlugin,
  ClickScrollPlugin,
]);

function loader() {}

function DevicesPage() {
  const params = useParams();

  const mounted = useRef<boolean>(false);
  const osRef = useRef<OverlayScrollbarsComponentRef>(null);
  const latestMessageInViewRef = useRef<boolean>(false);
  const [footerRef, { height: footerHeight }] = useMeasure<HTMLElement>();

  const theme = useSynclanStore((s) => s.config?.theme);
  const realTheme = useMemo(() => {
    if (theme === 'system') {
      return matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme;
  }, [theme]);

  const { sendMessage } = useAppContext();

  const current = useDeviceStore((s) => s.current);
  const isHydrated = useIMStore(
    useCallback(
      (s) => s.messageCaches.get(params.id || '')?.hydrated ?? false,
      [params.id],
    ),
  );
  const addMessage = useIMStore((s) => s.addMessage);
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
      const lastPage = queryData.pages[queryData.pages.length - 1];
      if (lastPage.data && lastPage.data.length > 0) {
        useIMStore.getState().setHistory(params.id!, lastPage.data);
      }
    }
  }, [queryData, params.id]);

  const messages = useIMStore(
    useShallow((s) => {
      const messageCache = s.messageCaches.get(params.id!);
      if (!messageCache) return [];
      return messageCache.order.map((id) => messageCache.messages.get(id)!);
    }),
  );

  const virtualizer = useVirtualizer({
    count: messages.length,
    overscan: 10,
    // scrollMargin: 20,
    // paddingStart: 12,
    paddingEnd: footerHeight + 16,
    // gap: 12,
    estimateSize: () => 120,
    getScrollElement: () =>
      osRef.current?.osInstance()?.elements().viewport ?? null,
    getItemKey: useCallback(
      (index: number) => messages[index]!.uuid,
      [messages],
    ),
    anchorTo: 'end',
    followOnAppend: 'smooth',
    scrollEndThreshold: 80,
    directDomUpdates: true,
  });

  useLayoutEffect(() => {
    if (mounted.current || messages.length === 0) return;
    mounted.current = true;
    requestAnimationFrame(() => {
      virtualizer.scrollToEnd({ behavior: 'auto' });
    });
  }, [virtualizer, messages.length]);

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
    console.log('message', message);
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
      className='flex flex-col'
      style={{
        height: 'calc(100vh - 64px)',
        ['--footer-height' as any]: `${footerHeight}px`,
      }}
    >
      <OverlayScrollbarsComponent
        ref={osRef}
        className='chat-container flex-1 overflow-x-hidden overflow-y-auto'
        options={{
          scrollbars: {
            theme: realTheme === 'dark' ? 'os-theme-light' : 'os-theme-dark',
            autoHide: 'scroll',
            dragScroll: true,
            clickScroll: true,
          },
          overflow: {
            x: 'hidden',
            y: 'scroll',
          },
        }}
        events={{
          scroll: (_instance, event) => {
            if (
              !mounted.current ||
              virtualizer.isAtEnd(80) ||
              isFetchingPreviousPage ||
              !hasPreviousPage
            )
              return;

            if (
              event.currentTarget &&
              (event.currentTarget as HTMLElement).scrollTop < 120
            ) {
              void fetchPreviousPage();
            }
          },
        }}
      >
        <div ref={virtualizer.containerRef} className='relative w-full'>
          {virtualItems.map((virtualItem) => {
            const message = messages[virtualItem.index],
              previousMessage = messages[virtualItem.index - 1] || void 0,
              right = message.sender === current?.id,
              isLatest = virtualItem.index === messages.length - 1;

            if (isLatest)
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className='absolute top-0 left-0 w-full'
                >
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
                </div>
              );

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className='absolute top-0 left-0 w-full'
              >
                <MessageWrapper
                  message={message}
                  previousMessage={previousMessage}
                  position={right ? 'right' : 'left'}
                />
              </div>
            );
          })}
        </div>
      </OverlayScrollbarsComponent>

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
