import { AspectRatio } from '../ui';
import { MEDIA_MAX_WIDTH, parseMessageExtra } from './util';

type Props = {
  message: VideoMessage;
};

function VideoMessage({ message }: Props) {
  const extra = parseMessageExtra<MediaMessageExtra>(message.extra);
  const width = Math.min(MEDIA_MAX_WIDTH, extra?.width || MEDIA_MAX_WIDTH);
  let ratio = 16 / 9;
  if (extra?.width && extra?.height) {
    ratio = extra.width / extra.height;
  }
  return (
    <div style={{ width }}>
      <AspectRatio ratio={ratio}>
        <video controls src={message.content} className='w-full h-full' />
      </AspectRatio>
    </div>
  );
}

export { VideoMessage };
