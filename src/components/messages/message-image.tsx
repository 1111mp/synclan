import { calculateMediaSize, getMediaUrl } from '@/lib/media';

import { parseMessageExtra } from './util';

type Props = {
  message: ImageMessage;
};

function ImageMessage({ message }: Props) {
  const extra = parseMessageExtra<MediaMessageExtra>(message.extra);

  const { width, height } = calculateMediaSize(extra?.width, extra?.height);

  return (
    <div style={{ width, height }}>
      <img
        loading='lazy'
        src={getMediaUrl(message.content)}
        className='h-full w-full rounded-md object-contain'
      />
    </div>
  );
}

export { ImageMessage };
