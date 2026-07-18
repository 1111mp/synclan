import { Smile } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    <Tooltip>
      <TooltipTrigger asChild>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              className='text-muted-foreground hover:text-muted-foreground'
              size='sm'
              variant='ghost'
            >
              <Smile className='size-6' />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align='center'
            side='top'
            sideOffset={12}
            className='w-auto p-0'
            onEscapeKeyDown={(event) => event.preventDefault()}
          >
            <EmojiPicker
              onClose={() => {
                setOpen(false);
              }}
              {...props}
            />
          </PopoverContent>
        </Popover>
      </TooltipTrigger>
      <TooltipContent>表情</TooltipContent>
    </Tooltip>
  );
}

export { EmojiButton };
