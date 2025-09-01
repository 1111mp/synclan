'use no memo';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { MessageWrapper } from '@/components';
import { Transmitter } from './transmitter';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { faker } from '@faker-js/faker';
import { useInView, InView } from 'react-intersection-observer';

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

async function fetchServerPage(cursor: number) {
  const pageSize = 20;
  let baseTime = Date.now();

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

function RoomPage() {
  const params = useParams();

  const loaderInView = useInView();
  const contentRef = useRef<HTMLDivElement>(null);
  const hasInitScroll = useRef<boolean>(false);
  const preLength = useRef<number>(0);
  const lastMessageInViewRef = useRef<boolean>(false);

  const {
    status,
    data,
    error,
    isFetching,
    isFetchingPreviousPage,
    hasPreviousPage,
    fetchPreviousPage,
  } = useInfiniteQuery({
    queryKey: ['messages', params.id],
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    queryFn: async ({ pageParam }) => fetchServerPage(pageParam),
    getPreviousPageParam: (firstPage) => firstPage.previousId ?? undefined,
    getNextPageParam: (lastPage) => lastPage.nextId ?? undefined,
  });
  // console.log('data', data);

  useEffect(() => {
    if (loaderInView.inView) {
      fetchPreviousPage();
    }
  }, [fetchPreviousPage, loaderInView.inView]);

  const messages = useMemo(() => {
    return data?.pages?.flatMap((p) => p.data) ?? [];
  }, [data]);

  const virtualizer = useVirtualizer({
    count: messages.length,
    overscan: 10,
    scrollMargin: 20,
    paddingEnd: 12,
    // gap: 12,
    estimateSize: () => 45,
    getScrollElement: () => contentRef.current,
    getItemKey: useCallback((index: number) => messages[index].id, [messages]),
  });

  useEffect(() => {
    if (!hasInitScroll.current && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
      hasInitScroll.current = true;
    }
  }, [messages.length, virtualizer]);

  const items = virtualizer.getVirtualItems();

  const need = messages.length > preLength.current && hasInitScroll.current;
  if (need) {
    const offset =
      (virtualizer.scrollOffset ?? 0) + (data?.pages[0].data ?? []).length * 45;
    // eslint-disable-next-line react-compiler/react-compiler
    virtualizer.scrollOffset = offset;
    virtualizer.calculateRange();
    virtualizer.scrollToOffset(offset, { align: 'start' });
  }
  preLength.current = messages.length;

  const renderMessageList = () => {
    if (!hasInitScroll.current && messages.length === 0) return null;

    return (
      <div
        ref={contentRef}
        className='w-full flex-1 overflow-y-auto contain-strict scrollbar-color dark:scrollbar-color'
      >
        {hasInitScroll.current && (
          <div ref={loaderInView.ref} className='bg-red-400 absolute top-20'>
            {isFetchingPreviousPage
              ? 'Loading more...'
              : hasPreviousPage
                ? 'Load Older'
                : 'Nothing more to load'}
          </div>
        )}

        <div
          className='relative w-full'
          style={{ height: virtualizer.getTotalSize() }}
        >
          <div
            className='w-full absolute top-0 left-0'
            style={{
              transform: `translateY(${(items[0]?.start ?? 0) - virtualizer.options.scrollMargin}px)`,
            }}
          >
            {items.map((row) => {
              const message = messages[row.index],
                previousMessage = messages[row.index - 1] || void 0,
                left = row.index % 2 === 0,
                isLast = row.index === messages.length - 1;

              if (isLast)
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
        </div>
      </div>
    );
  };

  return (
    <div className='h-full flex flex-col'>
      <header className='w-full h-14 flex items-center px-3 border-b border-solid border-black/16 dark:border-white/16  shadow-sm overflow-hidden'>
        <h1
          onClick={() => {
            console.log('lastMessageInView', lastMessageInViewRef.current);
            if (lastMessageInViewRef.current) {
              virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
            }
          }}
        >
          Room Page: {params.id}
        </h1>
      </header>
      {renderMessageList()}
      <footer className='w-full'>
        <Transmitter />
      </footer>
    </div>
  );
}

export { RoomPage as Component, loader };
