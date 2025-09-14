import { cva, type VariantProps } from 'class-variance-authority';
import { emojiToImage, getImagePath, type SkinToneKey } from './lib';
import { cn } from '@/lib/utils';

const variants = cva('', {
  variants: {
    size: {
      16: 'size-4',
      18: 'size-[18px]',
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

function Emoji({
  emoji,
  className,
  shortName,
  skinTone = 0,
  size = 28,
}: Props) {
  let image = '';
  if (shortName) {
    image = getImagePath(shortName, skinTone);
  } else if (emoji) {
    image = emojiToImage(emoji) || '';
  }

  if (!image) return null;

  return (
    <img
      src={image}
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
