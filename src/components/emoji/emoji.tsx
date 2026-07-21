import { cva, type VariantProps } from 'class-variance-authority';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { emojiToImage, getImagePath, type SkinToneKey } from './lib';

const variants = cva('', {
  variants: {
    size: {
      16: 'size-4',
      18: 'size-4.5',
      20: 'size-5',
      24: 'size-6',
      28: 'size-7',
      32: 'size-8',
    },
  },
});

type Props = {
  className?: string;
  emoji?: string;
  shortName?: string;
  skinTone?: SkinToneKey | number;
} & VariantProps<typeof variants>;

function fetchImageSrc(
  shortName?: string,
  emoji?: string,
  skinTone?: SkinToneKey | number,
): Promise<string> {
  if (shortName) {
    return getImagePath(shortName, skinTone);
  }
  if (emoji) {
    return Promise.resolve(emojiToImage(emoji) || '');
  }
  return Promise.resolve('');
}

function Emoji({
  emoji,
  className,
  shortName,
  skinTone = 0,
  size = 28,
}: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void fetchImageSrc(shortName, emoji, skinTone).then((src) => {
      if (isMounted) setImageSrc(src);
    });

    return () => {
      isMounted = false;
    };
  }, [shortName, emoji, skinTone]);

  if (!imageSrc) return null;

  return (
    <img
      src={imageSrc}
      aria-label={emoji}
      title={emoji}
      data-tone={skinTone}
      data-short-name={shortName}
      className={cn(
        'transform-gpu align-baseline',
        variants({ size, className }),
      )}
    />
  );
}

export { Emoji };
