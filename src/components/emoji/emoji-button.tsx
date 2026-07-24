import { Smile } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsMobile } from '@/hooks';
import { isWeb } from '@/lib/constant';

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui';
import { EmojiPicker, type EmojiPickerProps } from './emoji-picker';

type Props = Pick<
  EmojiPickerProps,
  'doSend' | 'onPickEmoji' | 'onSetSkinTone' | 'recentEmojis' | 'skinTone'
>;

function EmojiButton({ ...props }: Props) {
  const [open, setOpen] = useState<boolean>(false);

  const isMobile = useIsMobile();
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const { ctrlKey, metaKey, shiftKey, key } = event;
      const commandKey = OS_PLATFORM === 'darwin' && metaKey;
      const controlKey = OS_PLATFORM !== 'darwin' && ctrlKey;
      const commandOrCtrl = commandKey || controlKey;

      if (commandOrCtrl && shiftKey && (key === 'j' || key === 'J')) {
        event.stopPropagation();
        event.preventDefault();

        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip delayDuration={300} open={isMobile && isWeb ? false : undefined}>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              className='text-muted-foreground hover:text-muted-foreground px-1.5'
              size='sm'
              variant='ghost'
            >
              <Smile className='size-6' />
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent>{t('emoji.title')}</TooltipContent>
      </Tooltip>
      <PopoverContent
        align='center'
        side='top'
        sideOffset={12}
        className='w-auto p-0'
        onCloseAutoFocus={(evt) => evt.preventDefault()}
      >
        <EmojiPicker
          onClose={() => {
            setOpen(false);
          }}
          {...props}
        />
      </PopoverContent>
    </Popover>
  );
}

export { EmojiButton };
