import { useImagePreview } from '@/components';
import { calculateMediaSize, getMediaUrl } from '@/lib/media';

import { parseMessageExtra } from './util';

type Props = {
  message: ImageMessage;
};

function ImageMessage({ message }: Props) {
  const { openPreview } = useImagePreview();

  const extra = parseMessageExtra<MediaMessageExtra>(message.extra);

  const { width, height } = calculateMediaSize(extra?.width, extra?.height);

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
    <div style={{ width, height }}>
      <img
        loading='lazy'
        data-synclan-preview-image
        src={getMediaUrl(message.content)}
        className='h-full w-full rounded-md object-contain'
        onClick={onImagePreview}
      />
    </div>
  );
}

export { ImageMessage };
