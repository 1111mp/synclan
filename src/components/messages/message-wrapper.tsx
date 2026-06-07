import { Avatar, AvatarFallback, AvatarImage } from '../ui';
import { ImageMessage } from './message-image';
import { TextMessage } from './message-text';
import { VideoMessage } from './message-video';

import { cn } from '@/lib/utils';
import { isSameDay, renderTime } from './util';

type Props = {
  message: Message;
  previousMessage?: Message;
  position?: 'left' | 'right';
};

function MessageWrapper({
  message,
  previousMessage,
  position = 'left',
}: Props) {
  const renderMessage = () => {
    if (message.type === 'text') {
      return <TextMessage message={message} />;
    }

    if (message.type === 'image') {
      return <ImageMessage message={message} />;
    }

    if (message.type === 'video') {
      return <VideoMessage message={message} />;
    }

    return null;
  };

  return (
    <div className='w-full p-4'>
      {!isSameDay(message.createdAt, previousMessage?.createdAt) && (
        <div className='flex justify-center items-center py-4 text-xs font-normal'>
          {renderTime(message.createdAt)}
        </div>
      )}
      <div
        className={cn(
          'flex',
          position === 'left' ? 'justify-start' : 'justify-end',
        )}
      >
        {position === 'left' && (
          <Avatar className='mr-3'>
            <AvatarImage src='https://github.com/shadcn.png' />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        )}
        <div
          className={cn(
            'relative w-fit max-w-4/5 px-2 py-3 text-base leading-6 rounded-md shadow-md bg-gray-05 dark:bg-gray-75',
            'before:absolute before:top-3.5 before:border-6 before:border-solid before:border-transparent',
            position === 'left'
              ? 'before:right-full before:border-r-gray-05'
              : 'before:left-full before:border-l-gray-05',
          )}
        >
          {renderMessage()}
        </div>
        {position === 'right' && (
          <Avatar className='ml-3'>
            <AvatarImage src='https://github.com/shadcn.png' />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}

export { MessageWrapper };
