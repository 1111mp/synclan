import { User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { cn } from '@/lib/utils';

import { ImageMessage } from './message-image';
import { TextMessage } from './message-text';
import { VideoMessage } from './message-video';
import { isSameDay as isSameDayHandler, renderTime, THRESHOLD } from './util';

type Props = {
  message: IMessage;
  previousMessage?: IMessage;
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

  const isSameUser = previousMessage?.sender === message.sender;

  const isNewDay =
    !previousMessage ||
    !isSameDayHandler(message.createdAt, previousMessage.createdAt);

  const isTimeGapExceeded =
    !!previousMessage &&
    message.createdAt - previousMessage.createdAt > THRESHOLD;

  const isNewGroup =
    !previousMessage || !isSameUser || isNewDay || isTimeGapExceeded;

  return (
    <div
      className={cn(
        'w-full px-4 pb-1',
        isSameUser && !isNewGroup ? 'pt-1' : 'pt-4',
      )}
    >
      {isNewDay && (
        <div className='flex items-center justify-center py-3 text-xs font-normal'>
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
          <div className='mr-3 w-10'>
            {isNewGroup && (
              <Avatar size='lg'>
                <AvatarImage
                  className='rounded-full'
                  src='https://github.com/shadcn.png'
                />
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}
        <div
          className={cn(
            'relative w-fit max-w-4/5 px-2 py-3 text-base leading-6 rounded-md shadow-md bg-secondary',
            isNewGroup &&
              'before:absolute before:top-3.5 before:border-6 before:border-solid before:border-transparent',
            isNewGroup &&
              (position === 'left'
                ? 'before:right-full before:border-r-secondary'
                : 'before:left-full before:border-l-secondary'),
          )}
        >
          {renderMessage()}
        </div>
        {position === 'right' && (
          <div className='ml-3 w-10'>
            {isNewGroup && (
              <Avatar size='lg'>
                <AvatarImage
                  className='rounded-full'
                  src='https://github.com/shadcn.png'
                />
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { MessageWrapper };
