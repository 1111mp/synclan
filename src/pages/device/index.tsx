import { faker } from '@faker-js/faker';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer, elementScroll } from '@tanstack/react-virtual';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useInView, InView } from 'react-intersection-observer';
import { useParams } from 'react-router';

import { MessageWrapper, Transmitter } from '@/components';
import { Toaster } from '@/components/ui';

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
    });
  // .reverse();

  const nextId = data[data.length - 1].id + 1;
  const previousId = data[0].id - pageSize;

  return { data, nextId, previousId };
}

function RoomPage() {
  const params = useParams();

  const mounted = useRef<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const loaderInView = useInView();
  const lastMessageInViewRef = useRef<boolean>(false);

  const {
    // status,
    data,
    // error,
    // isFetching,
    isFetchingNextPage,
    // isFetchingPreviousPage,
    hasNextPage,
    // hasPreviousPage,
    fetchNextPage,
    // fetchPreviousPage,
  } = useInfiniteQuery({
    queryKey: ['messages', params.id],
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    queryFn: async ({ pageParam }) => fetchServerPage(pageParam),
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
    paddingStart: 12,
    // gap: 12,
    estimateSize: () => 120,
    getScrollElement: () => contentRef.current,
    scrollToFn(offset, options, instance) {
      return elementScroll(offset * -1, options, instance);
    },
  });

  useEffect(() => {
    // @ts-expect-error Overriding private method.
    const getScrollOffset = virtualizer.getScrollOffset;

    // @ts-expect-error Overriding private method.
    // oxlint-disable-next-line react-compiler/react-compiler
    virtualizer.getScrollOffset = () => Math.abs(getScrollOffset());
  }, [virtualizer]);

  useEffect(() => {
    if (!mounted.current && virtualizer.elementsCache.size) {
      virtualizer.scrollToIndex(0);
      // setMounted(true);
      mounted.current = true;
    }
  }, [virtualizer, virtualizer.elementsCache.size]);

  useEffect(() => {
    if (!mounted.current || !loaderInView.inView || isFetchingNextPage) return;

    void fetchNextPage();
  }, [fetchNextPage, isFetchingNextPage, loaderInView.inView]);

  const items = virtualizer.getVirtualItems();

  const renderMessageList = () => {
    return (
      <div
        ref={contentRef}
        className='scrollbar-color dark:scrollbar-color flex w-full flex-1 flex-col-reverse overflow-y-auto contain-strict'
      >
        <div
          className='relative flex w-full shrink-0 flex-col-reverse'
          style={{ height: virtualizer.getTotalSize() }}
        >
          <div
            className='flex w-full flex-col-reverse'
            style={{
              transform: `translateY(${-(items[0]?.start ?? 0) - virtualizer.options.scrollMargin}px)`,
            }}
          >
            {items.map((row) => {
              const message = messages[row.index],
                previousMessage = messages[row.index - 1] || void 0,
                left = row.index % 2 === 0,
                isBegin = row.index === 0;

              if (isBegin)
                return (
                  <div
                    key={row.key}
                    data-index={row.index}
                    ref={virtualizer.measureElement}
                  >
                    <InView
                      as='div'
                      onChange={(inView) => {
                        lastMessageInViewRef.current = inView;
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
                  key={row.key}
                  data-index={row.index}
                  ref={virtualizer.measureElement}
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
          {hasNextPage && (
            <div
              ref={loaderInView.ref}
              className='absolute top-96 flex w-full items-center justify-center'
            >
              {isFetchingNextPage ? (
                <LoaderCircle
                  className='text-primary animate-spin opacity-50'
                  size={28}
                />
              ) : (
                'Load Older'
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className='relative flex h-full flex-col'>
      <header className='flex h-14 w-full items-center overflow-hidden border-b border-solid border-black/16 px-3 shadow-sm dark:border-white/16'>
        <h1
          onClick={() => {
            console.log('lastMessageInView', lastMessageInViewRef.current);
            if (lastMessageInViewRef.current) {
              virtualizer.scrollToIndex(0, { align: 'end' });
            }
          }}
        >
          Room Page: {params.id}
        </h1>
      </header>
      {renderMessageList()}
      <footer className='w-full'>
        <Transmitter
          onLineOverflow={() => {
            if (lastMessageInViewRef.current) {
              virtualizer.scrollToIndex(0, { align: 'end' });
            }
          }}
        />
      </footer>
      <Toaster />
    </div>
  );
}

export { RoomPage as Component, loader };
