import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const variants = cva(
  'emoji-button mouse-mode:outline-none after:bg-gray-60 after:dark:bg-gray-25 after:block after:content-normal after:w-5 after:h-5 after:mask-no-repeat after:mask-center after:mask-size-[100%]',
  {
    variants: {
      category: {
        search:
          'after:mask-[url(/images/icons/v2/search-16.svg)] after:dark:mask-[url(/images/icons/v2/search-16.svg)]',
        close:
          'after:mask-[url(/images/icons/v2/x-24.svg)] after:dark:mask-[url(/images/icons/v2/x-24.svg)]',
        recents:
          'after:mask-[url(/images/icons/v2/recent-outline-20.svg)] after:dark:mask-[url(/images/icons/v2/recent-solid-20.svg)]',
        emoji:
          'after:mask-[url(/images/icons/v2/emoji-smiley-outline-20.svg)] after:dark:mask-[url(/images/icons/v2/emoji-smiley-solid-20.svg)]',
        animal:
          'after:mask-[url(/images/icons/v2/emoji-animal-outline-20.svg)] after:dark:mask-[url(/images/icons/v2/emoji-animal-solid-20.svg)]',
        food: 'after:mask-[url(/images/icons/v2/emoji-food-outline-20.svg)] after:dark:mask-[url(/images/icons/v2/emoji-food-solid-20.svg)]',
        activity:
          'after:mask-[url(/images/icons/v2/emoji-activity-outline-20.svg)] after:dark:mask-[url(/images/icons/v2/emoji-activity-solid-20.svg)]',
        travel:
          'after:mask-[url(/images/icons/v2/emoji-travel-outline-20.svg)] after:dark:mask-[url(/images/icons/v2/emoji-travel-solid-20.svg)]',
        object:
          'after:mask-[url(/images/icons/v2/emoji-object-outline-20.svg)] after:dark:mask-[url(/images/icons/v2/emoji-object-solid-20.svg)]',
        symbol:
          'after:mask-[url(/images/icons/v2/emoji-symbol-outline-20.svg)] after:dark:mask-[url(/images/icons/v2/emoji-symbol-solid-20.svg)]',
        flag: 'after:mask-[url(/images/icons/v2/emoji-flag-outline-20.svg)] after:dark:mask-[url(/images/icons/v2/emoji-flag-solid-20.svg)]',
      },
    },
  },
);

type Props = React.ComponentProps<'button'> & VariantProps<typeof variants>;

function EmojiCategory({ className, category, ...props }: Props) {
  return (
    <button className={cn(variants({ category, className }))} {...props} />
  );
}

export { EmojiCategory, type Props };
