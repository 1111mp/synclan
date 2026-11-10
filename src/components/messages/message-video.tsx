import { useTranslation } from 'react-i18next';

import { useIsMobile } from '@/hooks';
import { calculateMediaSize, getMediaUrl } from '@/lib/media';

import { MessageMediaFrame } from './message-media-frame';
import { useMediaLoadState } from './use-media-load-state';
import { parseMessageExtra } from './util';

type Props = {
  message: VideoMessage;
};

function VideoMessage({ message }: Props) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { status, attempt, retry, onLoad, onError } = useMediaLoadState();

  const extra = parseMessageExtra<MediaMessageExtra>(message.extra);

  const { width, height } = calculateMediaSize({
    width: extra?.width,
    height: extra?.height,
    isMobile,
  });

  return (
    <MessageMediaFrame
      width={width}
      height={height}
      status={status}
      onRetry={retry}
      mediaType='video'
      name={extra?.name}
    >
      <video
        src={getMediaUrl(message.content)}
        key={`${message.content}-${attempt}`}
        aria-label={extra?.name || t('message.video')}
        onLoadedMetadata={onLoad}
        onError={onError}
        controls
        playsInline
        preload='metadata'
        className='size-full object-contain'
      />
    </MessageMediaFrame>
  );
}

export { VideoMessage };
