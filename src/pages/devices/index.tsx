import { faker } from '@faker-js/faker';
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

import 'overlayscrollbars/overlayscrollbars.css';
import { InView } from 'react-intersection-observer';
import { useParams } from 'react-router';
import { useMeasure } from 'react-use';

import { MessageWrapper, Transmitter } from '@/components';
import { Toaster } from '@/components/ui';
import { useSynclanStore } from '@/stores';

OverlayScrollbars.plugin([
  ScrollbarsHidingPlugin,
  SizeObserverPlugin,
  ClickScrollPlugin,
]);

function loader() {}

const randomNumber = (min: number, max: number) =>
  faker.number.int({ min, max });

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomGapMs() {
  const r = Math.random();
  if (r < 0.6) {
    return randomInt(30, 300) * 1000; // 30秒 ~ 5分钟
  } else if (r < 0.9) {
    return randomInt(1, 3) * 60 * 60 * 1000; // 1 ~ 3 小时
  } else {
    return randomInt(1, 3) * 24 * 60 * 60 * 1000; // 1 ~ 3 天
  }
}

function getRandomMessageType(): Message['type'] {
  const r = Math.random();
  if (r < 0.6) return 'text';
  if (r < 0.85) return 'image';
  return 'video';
}

function getImageMessageExtra() {
  const width = randomNumber(200, 800);
  const height = randomNumber(200, 800);
  return {
    width,
    height,
    url: `https://picsum.photos/${width}/${height}?random=${Math.random()}`,
  };
}

function getVideoMessageExtra() {
  return {
    url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    width: 640,
    height: 360,
    duration: randomNumber(5, 60), // 秒
    thumbnail: 'https://picsum.photos/640/360?random=' + Math.random(),
  };
}

// function sleep() {
//   return new Promise((resolve) => {
//     setTimeout(resolve, 1000);
//   });
// }

async function fetchServerPage(cursor: number) {
  const pageSize = 20;
  let baseTime = Date.now();

  // await sleep();

  const data: Message[] = Array(pageSize)
    .fill(0)
    .map((_, i) => {
      baseTime -= randomGapMs();

      const type = getRandomMessageType();

      let message: any = {
        id: i + cursor * pageSize,
        uuid: `${i + cursor * pageSize}`,
        type,
        sender: Math.random() < 0.5 ? '11111' : '22222',
        receiver: Math.random() < 0.5 ? '22222' : '11111',
        createdAt: baseTime,
        updatedAt: baseTime,
      };

      if (type === 'text') {
        message.content = faker.lorem.sentence(randomNumber(20, 140));
      } else if (type === 'image') {
        const image = getImageMessageExtra();
        message.content = image.url;
        message.extra = JSON.stringify(image);
      } else if (type === 'video') {
        const video = getVideoMessageExtra();
        message.content = video.url;
        message.extra = JSON.stringify(video);
      }

      return message as Message;
    })
    .reverse();

  const nextId = data[data.length - 1].id + 1;
  const previousId = data[0].id - pageSize;

  return { data, nextId, previousId };
}

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

  const {
    // status,
    data,
    // error,
    // isFetching,
    isFetchingNextPage,
    // isFetchingPreviousPage,
    // hasNextPage,
    // hasPreviousPage,
    // fetchNextPage,
    fetchPreviousPage,
  } = useInfiniteQuery({
    queryKey: ['messages', params.id],
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    queryFn: ({ pageParam }) => fetchServerPage(pageParam),
    getPreviousPageParam: (firstPage) => firstPage.previousId ?? undefined,
    getNextPageParam: (lastPage) => lastPage.nextId ?? undefined,
  });

  const messages = useMemo(() => {
    return data?.pages?.flatMap((p) => p.data) ?? [];
  }, [data]);

  const virtualizer = useVirtualizer({
    count: messages.length,
    overscan: 10,
    // scrollMargin: 20,
    // paddingStart: 12,
    paddingEnd: footerHeight,
    // gap: 12,
    estimateSize: () => 120,
    getScrollElement: () =>
      osRef.current?.osInstance()?.elements().viewport ?? null,
    getItemKey: useCallback((index: number) => messages[index]!.id, [messages]),
    anchorTo: 'end',
    followOnAppend: true,
    scrollEndThreshold: 80,
    directDomUpdates: true,
  });

  useLayoutEffect(() => {
    if (mounted.current || messages.length === 0) return;
    requestAnimationFrame(() => {
      virtualizer.scrollToEnd({ behavior: 'auto' });
      mounted.current = true;
    });
  }, [virtualizer, messages.length]);

  useEffect(() => {
    console.log('footerHeight', footerHeight);

    if (footerHeight <= 46 || !latestMessageInViewRef.current) return;

    virtualizer.scrollToEnd({ behavior: 'smooth' });
  }, [footerHeight, virtualizer]);

  useEffect(() => {
    const osInstance = osRef.current?.osInstance();
    if (!osInstance) return;

    const scrollbarVertical = osInstance.elements().scrollbarVertical;
    if (scrollbarVertical) {
      // scrollbarVertical.scrollbar.style.paddingTop = `${16}px`;
      scrollbarVertical.scrollbar.style.paddingBottom = `${footerHeight + 8}px`;
    }
  }, [footerHeight]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className='flex flex-col' style={{ height: 'calc(100vh - 64px)' }}>
      <OverlayScrollbarsComponent
        ref={osRef}
        className='flex-1 overflow-x-hidden overflow-y-auto'
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
              isFetchingNextPage
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
              left = virtualItem.index % 2 === 0,
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
                      position={left ? 'left' : 'right'}
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
                  position={left ? 'left' : 'right'}
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
        <Transmitter />
      </footer>
      <Toaster />
    </div>
  );
}

export { DevicesPage as Component, loader };
