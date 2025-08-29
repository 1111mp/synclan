import { CaseSensitive, Maximize2 } from 'lucide-react';
import {
  Button,
  CompositionInput,
  EmojiButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components';

function Transmitter() {
  return (
    <div className='px-4 pb-4'>
      <div className='flex items-center p-3 border rounded-lg'>
        <div className='flex-1'>
          <CompositionInput />
        </div>
        <ul className='flex items-center pl-4 space-x-1'>
          <li className='flex items-center'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className='text-muted-foreground hover:text-muted-foreground'
                  size='xs'
                  variant='ghost'
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
                  className='bg-primary/30 hover:bg-primary/30'
                  size='xs'
                  variant='ghost'
                >
                  <svg
                    className='size-6 text-primary'
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
    </div>
  );
}

export { Transmitter };
