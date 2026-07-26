import { useIsMobile } from '@/hooks';
import { calculateMediaSize, getMediaUrl } from '@/lib/media';

import { parseMessageExtra } from './util';

type Props = {
  message: VideoMessage;
};

function VideoMessage({ message }: Props) {
  const isMobile = useIsMobile();

  const extra = parseMessageExtra<MediaMessageExtra>(message.extra);

  const { width, height } = calculateMediaSize({
    width: extra?.width,
    height: extra?.height,
    isMobile,
  });

  return (
    <div style={{ width, height }}>
      <video
        src={getMediaUrl(message.content)}
        poster='/clapperboard.svg'
        controls
        playsInline
        preload='metadata'
        className='size-full rounded-md object-contain'
      />
    </div>
  );
}

export { VideoMessage };
