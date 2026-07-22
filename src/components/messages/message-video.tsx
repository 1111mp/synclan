import { calculateMediaSize, getMediaUrl } from '@/lib/media';

import { parseMessageExtra } from './util';

type Props = {
  message: VideoMessage;
};

function VideoMessage({ message }: Props) {
  const extra = parseMessageExtra<MediaMessageExtra>(message.extra);

  const { width, height } = calculateMediaSize(extra?.width, extra?.height);

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
