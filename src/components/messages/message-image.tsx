import { useTranslation } from 'react-i18next';

import { useImagePreview } from '@/components';
import { useIsMobile } from '@/hooks';
import { calculateMediaSize, getMediaUrl } from '@/lib/media';

import { MessageMediaFrame } from './message-media-frame';
import { useMediaLoadState } from './use-media-load-state';
import { parseMessageExtra } from './util';

type Props = {
  message: ImageMessage;
};

function ImageMessage({ message }: Props) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { status, attempt, retry, onLoad, onError } = useMediaLoadState();
  const { openPreview } = useImagePreview();

  const extra = parseMessageExtra<MediaMessageExtra>(message.extra);

  const { width, height } = calculateMediaSize({
    width: extra?.width,
    height: extra?.height,
    isMobile,
  });

  const onImagePreview = () => {
    if (!message.content) return;

    const container = document.querySelector('#synclan-device-message-list');
    if (!container) return;

    const images = Array.from(
      container.querySelectorAll('img[data-synclan-preview-image]'),
    )
      .map((img) => img.getAttribute('src'))
      .filter((src) => src !== null);

    const index = images.indexOf(getMediaUrl(message.content));

    openPreview(images, index);
  };

  return (
    <MessageMediaFrame
      width={width}
      height={height}
      status={status}
      onRetry={retry}
      mediaType='image'
      name={extra?.name}
    >
      <button
        type='button'
        className='focus-visible:ring-ring block size-full cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-inset'
        aria-label={t('message.previewImage')}
        disabled={status !== 'ready'}
        onClick={onImagePreview}
      >
        <img
          key={`${message.content}-${attempt}`}
          loading={attempt > 0 ? 'eager' : 'lazy'}
          draggable='false'
          data-synclan-preview-image
          alt={extra?.name || t('message.image')}
          src={getMediaUrl(message.content)}
          className='h-full w-full object-contain'
          style={{ visibility: status === 'ready' ? 'visible' : 'hidden' }}
          onLoad={onLoad}
          onError={onError}
        />
      </button>
    </MessageMediaFrame>
  );
}

export { ImageMessage };
