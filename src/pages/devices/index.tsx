import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { debounce } from 'lodash-es';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InView } from 'react-intersection-observer';
import { useParams } from 'react-router';
import { useMeasure } from 'react-use';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useShallow } from 'zustand/react/shallow';

import { useAppContext } from '@/app-context';
import { Transmitter, type CompositionInputProps } from '@/components';
import {
  MessageAnimatedWrapper,
  MessageContextMenu,
  type MessageContextMenuRef,
} from '@/components/messages';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Toaster,
} from '@/components/ui';
import { prepareMessageContent } from '@/lib/attachment';
import { HttpStatus } from '@/lib/types';
import { getMessages } from '@/services/cmd';
import { useDeviceStore, useIMStore, useMessageAnimationStore } from '@/stores';

function loader() {}

function DevicesPage() {
  const [autoHistoryEnabled, setAutoHistoryEnabled] = useState<boolean>(false);

  const mounted = useRef<boolean>(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const latestMessageInViewRef = useRef<boolean>(false);
  const isFetching = useRef<boolean>(false);
  const [footerRef, { height: footerHeight }] = useMeasure<HTMLElement>();
  const autoScrollEnabledRef = useRef<boolean>(false);
  const msgCtxMenu = useRef<MessageContextMenuRef>(null);

  const params = useParams();

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
    initialPageParam: { lastId: undefined as number | undefined, pageSize: 40 },
    refetchOnWindowFocus: false,
    queryFn: ({ pageParam }) =>
      getMessages({
        selfId: current?.id || '',
        targetId: params.id || '',
        lastId: pageParam.lastId,
        pageSize: pageParam.pageSize,
      }),
    getPreviousPageParam: (firstPage) => {
      if (!firstPage.nextCursor) return undefined;
      return {
        lastId: firstPage.nextCursor,
        pageSize: 12,
      };
    },
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
    overscan: 8,
    // paddingStart: 12,
    paddingEnd: 16,
    // gap: 12,
    estimateSize: () => 160,
    getScrollElement: () => viewportRef.current,
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
    if (autoHistoryEnabled) return;
    virtualizer.scrollToIndex(messages.length - 1);
  }, [virtualizer, messages.length, autoHistoryEnabled]);

  const debouncedAction = useMemo(() => {
    return debounce(() => {
      autoScrollEnabledRef.current = true;
    }, 120);
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      if (autoScrollEnabledRef.current || !latestMessageInViewRef.current)
        return;
      setTimeout(() => {
        virtualizer.scrollToEnd();
      }, 30);
      debouncedAction();
    };

    window.__refreshVirtualList = handleRefresh;

    return () => {
      window.__refreshVirtualList = undefined;
      debouncedAction.cancel();
    };
  }, [virtualizer, debouncedAction]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setAutoHistoryEnabled(true);
    }, 250);

    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!params.id) return;

    debouncedAction.cancel();
    autoScrollEnabledRef.current = false;
  }, [params.id, debouncedAction]);

  useEffect(() => {
    if (!params.id || mounted.current) return;
    mounted.current = true;
    setActiveConversation(params.id);
  }, [params.id, setActiveConversation]);

  useEffect(() => {
    if (footerHeight <= 46 || !latestMessageInViewRef.current) return;

    virtualizer.scrollToEnd({ behavior: 'smooth' });
  }, [footerHeight, virtualizer]);

  const onSend: CompositionInputProps['onSend'] = async (
    content,
    attachments,
  ) => {
    const deviceId = params.id;
    if (!deviceId || !current) return;

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    const now = Date.now();
    const message: IMessage = {
      uuid: uuidv4(),
      type: 'text',
      sender: current.id,
      receiver: deviceId,
      content: trimmedContent,
      createdAt: now,
      updatedAt: now,
    };
    useMessageAnimationStore.getState().add(message.uuid);
    addMessage(deviceId, message, current.id);

    let finalContent: string;
    try {
      finalContent = await prepareMessageContent(trimmedContent, attachments);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload attachment',
      );
      return;
    }

    try {
      const result = await sendMessage({
        ...message,
        content: finalContent,
        updatedAt: Date.now(),
      });
      if (result.statusCode === HttpStatus.OK && result.data) {
        reconcileServerMessage(deviceId, message.uuid, result.data);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <MessageScrollerProvider defaultScrollPosition='end'>
      <div
        className='relative flex flex-col overflow-hidden'
        style={{
          height: 'calc(100vh - 64px)',
        }}
      >
        <MessageScroller>
          <MessageScrollerViewport
            ref={viewportRef}
            className='min-h-0 w-full overflow-x-hidden overflow-y-auto'
            onScroll={(event) => {
              msgCtxMenu.current?.hide();

              if (
                !autoHistoryEnabled ||
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
            <MessageScrollerContent
              // aria-busy={isBusy}
              className='block min-h-full'
            >
              <div ref={virtualizer.containerRef} className='relative w-full'>
                {virtualItems.map((virtualItem) => {
                  const message = messages[virtualItem.index],
                    previousMessage = messages[virtualItem.index - 1] || void 0,
                    isUserMessage = message.sender === current?.id,
                    isLatest = virtualItem.index === messages.length - 1;

                  return (
                    <div
                      key={virtualItem.key}
                      data-index={virtualItem.index}
                      ref={virtualizer.measureElement}
                      className='absolute top-0 left-0 w-full'
                    >
                      <InView
                        as='div'
                        skip={!isLatest}
                        onChange={(inView) => {
                          latestMessageInViewRef.current = inView;
                        }}
                      >
                        <MessageAnimatedWrapper
                          message={message}
                          userVariant='muted'
                          assistantVariant='muted'
                          isUserMessage={isUserMessage}
                          previousMessage={previousMessage}
                          onOpenContextMenu={(info) => {
                            msgCtxMenu.current?.open(info);
                          }}
                        />
                      </InView>
                    </div>
                  );
                })}
              </div>
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>

        <footer
          ref={footerRef}
          className='footer-gradient w-full shrink-0 pr-4 pb-2 pl-2'
        >
          <Transmitter onSend={onSend} />
        </footer>
        <MessageContextMenu ref={msgCtxMenu} />
        <Toaster />
      </div>
    </MessageScrollerProvider>
  );
}

export { DevicesPage as Component, loader };
