import { cva, type VariantProps } from 'class-variance-authority';
import { emojiToImage, getImagePath, type SkinToneKey } from './lib';
import { cn } from '@/lib/utils';

const variants = cva('', {
  variants: {
    size: {
      16: 'w-4 h-4',
      20: 'w-5 h-5',
      24: 'w-6 h-6',
      28: 'w-7 h-7',
      32: 'w-8 h-8',
    },
  },
});

type Props = {
  emoji?: string;
  shortName?: string;
  skinTone?: SkinToneKey | number;
} & VariantProps<typeof variants>;

function Emoji({ emoji, shortName, skinTone, size = 28 }: Props) {
  let image = '';
  if (shortName) {
    image = getImagePath(shortName, skinTone);
  } else if (emoji) {
    image = emojiToImage(emoji) || '';
  }

  return (
    <span
      className={cn(
        'flex justify-center items-center text-transparent',
        variants({ size }),
      )}
    >
      {image && (
        <img
          src={image}
          aria-label={emoji}
          title={emoji}
          className={cn('transform-gpu align-baseline', variants({ size }))}
        />
      )}
    </span>
  );
}

export { Emoji };
