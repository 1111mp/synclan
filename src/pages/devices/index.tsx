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
import {
  DragUploadOverlay,
  Transmitter,
  type CompositionInputProps,
  type DragUploadOverlayProps,
} from '@/components';
import { MessageAnimatedWrapper } from '@/components/messages';
import type { TransmitterMoreMenuProps } from '@/components/transmitter-more-menu';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui';
import { useIsMobile } from '@/hooks';
import { prepareMessageContent } from '@/lib/attachment';
import { createAttachmentMessage } from '@/lib/media';
import { HttpStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getMessages } from '@/services/cmd';
import { uploadFile } from '@/services/upload';
import {
  useCurrentConversation,
  useDeviceStore,
  useIMStore,
  useMessageAnimationStore,
} from '@/stores';

import { DeviceHeader } from './header';

function loader() {}

function DevicesPage() {
  const [autoHistoryEnabled, setAutoHistoryEnabled] = useState<boolean>(false);

  const mounted = useRef<boolean>(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const latestMessageInViewRef = useRef<boolean>(false);
  const isFetching = useRef<boolean>(false);
  const [footerRef, { height: footerHeight }] = useMeasure<HTMLElement>();
  const autoScrollEnabledRef = useRef<boolean>(false);

  const params = useParams();

  const { sendMessage } = useAppContext();

  const current = useDeviceStore((s) => s.current);
  const conversation = useCurrentConversation();
  const isHydrated = useIMStore(
    useCallback(
      (s) => s.messageCaches.get(params.id || '')?.hydrated ?? false,
      [params.id],
    ),
  );
  const addMessage = useIMStore((s) => s.addMessage);
  const setActiveConversation = useIMStore((s) => s.setActiveConversation);
  const reconcileServerMessage = useIMStore((s) => s.reconcileServerMessage);
  const syncDeviceInfo = useIMStore((s) => s.syncDeviceInfo);
  const exitConversation = useIMStore((s) => s.exitConversation);

  const isMobile = useIsMobile();

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

  // Reset actived conversation when unmounted
  useEffect(() => {
    if (!mounted.current) return;
    return () => exitConversation();
  }, [exitConversation]);

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

  useEffect(() => {
    const id = window.setTimeout(() => {
      setAutoHistoryEnabled(true);
    }, 250);

    return () => window.clearTimeout(id);
  }, []);

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

  // Sync device info
  useEffect(() => {
    if (!params.id) return;
    syncDeviceInfo(params.id);
  }, [params.id, syncDeviceInfo]);

  const onSend: CompositionInputProps['onSend'] = async ({
    content,
    plainContent,
    attachments,
  }) => {
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
      plainContent: plainContent?.trim(),
      createdAt: now,
      updatedAt: now,
    };
    useMessageAnimationStore.getState().add(message.uuid);
    addMessage(deviceId, message, current.id);

    if (latestMessageInViewRef.current) {
      setTimeout(() => virtualizer.scrollToEnd({ behavior: 'smooth' }));
    }

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
      // TODO
    }
  };

  const onSelectMedia: TransmitterMoreMenuProps['onSelectMedia'] = async (
    files,
  ) => {
    if (!files.length) return;

    const deviceId = params.id;
    if (!deviceId || !current) return;

    const pendingMessages = (
      await Promise.all(
        files.map(async (file) => {
          const message = await createAttachmentMessage(
            file,
            current.id,
            deviceId,
          );
          if (message.type === 'file') return null;

          useMessageAnimationStore.getState().add(message.uuid);
          addMessage(deviceId, message, current.id);

          if (latestMessageInViewRef.current) {
            setTimeout(() => virtualizer.scrollToEnd({ behavior: 'smooth' }));
          }

          return {
            file,
            message,
          };
        }),
      )
    ).filter((m) => m !== null);

    await Promise.all(
      pendingMessages.map(async ({ file, message }) => {
        try {
          const url = await uploadFile(file);

          const readyMessage = {
            ...message,
            content: url,
            updatedAt: Date.now(),
          };
          const result = await sendMessage(readyMessage);
          if (result.statusCode === HttpStatus.OK && result.data) {
            reconcileServerMessage(deviceId, message.uuid, result.data);
          }

          if (message.content) {
            URL.revokeObjectURL(message.content);
          }
        } catch {
          // TODO
        }
      }),
    );
  };

  const onSelectFile: TransmitterMoreMenuProps['onSelectFile'] = async (
    files,
  ) => {
    if (!files.length) return;

    const deviceId = params.id;
    if (!deviceId || !current) return;

    const pendingMessages = await Promise.all(
      files.map(async (file) => {
        const message = await createAttachmentMessage(
          file,
          current.id,
          deviceId,
        );

        useMessageAnimationStore.getState().add(message.uuid);
        addMessage(deviceId, message, current.id);

        if (latestMessageInViewRef.current) {
          setTimeout(() => virtualizer.scrollToEnd({ behavior: 'smooth' }));
        }

        return {
          file,
          message,
        };
      }),
    );

    await Promise.all(
      pendingMessages.map(async ({ file, message }) => {
        try {
          const url = await uploadFile(file);

          const readyMessage = {
            ...message,
            content: url,
            updatedAt: Date.now(),
          };
          const result = await sendMessage(readyMessage);
          if (result.statusCode === HttpStatus.OK && result.data) {
            reconcileServerMessage(deviceId, message.uuid, result.data);
          }

          if (message.content) {
            URL.revokeObjectURL(message.content);
          }
        } catch {
          // TODO
        }
      }),
    );
  };

  const onDrop: DragUploadOverlayProps['onDrop'] = async (files) => {
    await onSelectFile(files);
  };

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <DragUploadOverlay onDrop={onDrop}>
      <MessageScrollerProvider defaultScrollPosition='end'>
        <div
          id='synclan-device-message-list'
          className='relative flex h-dvh flex-col overflow-hidden'
        >
          <MessageScroller>
            <MessageScrollerViewport
              ref={viewportRef}
              className='min-h-0 w-full overflow-x-hidden overflow-y-auto'
              onScroll={(event) => {
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
              <DeviceHeader device={conversation?.device} />
              <MessageScrollerContent
                // aria-busy={isBusy}
                className='block min-h-[calc(100%-56px)]'
              >
                <div ref={virtualizer.containerRef} className='relative w-full'>
                  {virtualItems.map((virtualItem) => {
                    const message = messages[virtualItem.index],
                      previousMessage =
                        messages[virtualItem.index - 1] || void 0,
                      isUserMessage = message.sender === current?.id,
                      user = isUserMessage ? current : conversation?.device,
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
                            user={user}
                            previousMessage={previousMessage}
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
            className={cn(
              'footer-gradient w-full shrink-0 pr-4 pb-2 pl-2',
              isMobile && 'pr-2',
            )}
          >
            <Transmitter
              onSend={onSend}
              onSelectFile={onSelectFile}
              onSelectMedia={onSelectMedia}
            />
          </footer>
        </div>
      </MessageScrollerProvider>
    </DragUploadOverlay>
  );
}

export { DevicesPage as Component, loader };
