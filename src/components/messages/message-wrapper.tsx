import { User } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Bubble,
  BubbleContent,
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ui';
import { cn } from '@/lib/utils';

import { ImageMessage } from './message-image';
import { TextMessage } from './message-text';
import { VideoMessage } from './message-video';
import {
  isSameDay as isSameDayHandler,
  renderMessageTimee,
  renderTime,
  THRESHOLD,
} from './util';

type Props = {
  message: IMessage;
  previousMessage?: IMessage;
  align?: 'start' | 'end';
};

function MessageWrapper({ message, previousMessage, align = 'start' }: Props) {
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
    <Message
      align={align}
      className={cn(
        'relative px-4 pb-1',
        isSameUser && !isNewGroup ? 'pt-1' : 'pt-4',
      )}
    >
      <div className='flex items-center justify-center pt-3 text-xs font-normal'>
        {renderTime(message.createdAt)}
      </div>
      <MessageAvatar className='min-w-10 self-start'>
        {isNewGroup && (
          <Avatar size='lg'>
            <AvatarImage
              className='rounded-full'
              src='https://github.com/shadcn.png'
              alt='@me'
            />
            <AvatarFallback>
              <User />
            </AvatarFallback>
          </Avatar>
        )}
      </MessageAvatar>
      <MessageContent>
        <Bubble variant='secondary'>
          <BubbleContent>{renderMessage()}</BubbleContent>
        </Bubble>
      </MessageContent>
      <p
        className={cn(
          'pointer-events-none absolute opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 text-xs text-muted-foreground whitespace-nowrap',
          isNewGroup
            ? align === 'start'
              ? 'top-0 left-0 ml-16'
              : 'top-0 right-0 mr-16'
            : align === 'start'
              ? 'top-1/2 left-0 -translate-y-1/2 ml-7'
              : 'top-1/2 right-0 -translate-y-1/2 mr-6',
        )}
      >
        {renderMessageTimee(message.createdAt, isNewGroup)}
      </p>
    </Message>
  );
}

export { MessageWrapper };
