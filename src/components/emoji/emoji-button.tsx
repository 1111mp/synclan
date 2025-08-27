import { useEffect, useState } from 'react';
import { Smile } from 'lucide-react';
import { Button, Popover, PopoverContent, PopoverTrigger } from '../ui';
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
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant='ghost'>
          <Smile />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        side='top'
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
  );
}

export { EmojiButton };
