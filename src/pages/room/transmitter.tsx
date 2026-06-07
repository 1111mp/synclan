import { useState } from 'react';
import { CaseSensitive, Maximize2 } from 'lucide-react';
import {
  Button,
  CompositionInput,
  EmojiButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

function Transmitter() {
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const [focused, setFocueed] = useState<boolean>(true);
  const [lineOverflow, setLineOverflow] = useState<boolean>(false);

  return (
    <div className='px-4 pb-5'>
      <div
        className={cn(
          'flex items-center py-2 border rounded-lg bg-card',
          lineOverflow && 'flex-col space-y-3',
        )}
      >
        <div className='w-full'>
          <CompositionInput
            onLineChange={(changed) => {
              setLineOverflow(changed);
            }}
            onEmptyChange={(empty) => {
              setIsEmpty(empty);
            }}
            onFocusChange={(focus) => {
              setFocueed(focus);
            }}
          />
        </div>
        <ul className={cn('flex items-center self-end pl-4 pr-3 space-x-1')}>
          <li className='flex items-center'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className='text-muted-foreground hover:text-muted-foreground'
                  size='xs'
                  variant='ghost'
                  onClick={() => {
                    setLineOverflow((o) => !o);
                  }}
                >
                  <CaseSensitive className='size-[22px] mt-0.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>显示格式工具栏</TooltipContent>
            </Tooltip>
          </li>
          <li className='flex items-center'>
            <EmojiButton />
          </li>
          <li className='flex items-center'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className='text-muted-foreground hover:text-muted-foreground'
                  size='xs'
                  variant='ghost'
                >
                  <Maximize2 className='size-[18px]' strokeWidth={2.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>展开</TooltipContent>
            </Tooltip>
          </li>
          <li className='flex items-center ml-1'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={isEmpty}
                  className={cn(
                    'transition-all duration-300',
                    !isEmpty && 'bg-primary/30 hover:bg-primary/30',
                  )}
                  size='xs'
                  variant='ghost'
                >
                  <svg
                    className={cn(
                      'size-6 transition-all duration-300',
                      isEmpty ? 'text-input' : 'text-primary',
                    )}
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                    shapeRendering='crispEdges'
                  >
                    <path d='M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z' />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>发送(Enter)</TooltipContent>
            </Tooltip>
          </li>
        </ul>
      </div>
      <AnimatePresence>
        {!isEmpty && focused && (
          <motion.p
            className='absolute bottom-1 text-[10px] right-4'
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            exit={{ opacity: 0 }}
          >
            Shift + Enter 换行
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export { Transmitter };
