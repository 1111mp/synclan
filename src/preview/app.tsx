import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui';

function App() {
  const [list] = useState<PreviewCore[]>(
    () => window.__SYNCLAN__PREVIEW__INIT_DATA__?.list ?? [],
  );

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listen<PreviewContext>('synclan://update-preview-data', (event) => {
      console.log('子窗口收到事件:', event);
      // setList(event.payload);
    }).then((fn) => (unlisten = fn));

    return () => {
      unlisten?.();
    };
  }, []);

  return (
    <div>
      <Carousel
        opts={{
          startIndex: window.__SYNCLAN__PREVIEW__INIT_DATA__?.current ?? 0,
        }}
      >
        <CarouselContent>
          {list.map((media) => (
            <CarouselItem key={media.url}></CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

export default App;
