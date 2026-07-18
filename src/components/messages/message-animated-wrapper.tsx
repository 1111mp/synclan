import { CopyIcon, TrashIcon, User } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useRef } from 'react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Bubble,
  BubbleContent,
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Message,
  MessageAvatar,
  MessageContent,
  MessageScrollerItem,
} from '@/components/ui';
import {
  MESSAGE_ANIMATIONS,
  type MessageAnimationPreset,
} from '@/lib/message-animations';
import { cn, resolveResourceUrl } from '@/lib/utils';
import { deleteMessage } from '@/services/cmd';
import { useDeviceStore, useIMStore, useMessageAnimationStore } from '@/stores';

import { useConfirm } from '../confirm-dialog';
import { MessageExpandable } from './message-expandable';
import { ImageMessage } from './message-image';
import { TextMessage, type MessageContextMenuRef } from './message-text';
import { VideoMessage } from './message-video';
import {
  isSameDay as isSameDayHandler,
  renderMessageTimee,
  renderTime,
  THRESHOLD,
} from './util';

const MotionMessageScrollerItem = motion.create(MessageScrollerItem);

function MessageAnimatedWrapper({
  message,
  previousMessage,
  animationPreset = MESSAGE_ANIMATIONS['blur-fade'],
  assistantVariant = 'ghost',
  scrollAnchor,
  user,
  userVariant = 'muted',
  isUserMessage = false,
  ...props
}: Omit<
  React.ComponentProps<typeof MotionMessageScrollerItem>,
  'animate' | 'children' | 'exit' | 'initial' | 'messageId' | 'variants'
> & {
  animationPreset?: MessageAnimationPreset;
  assistantVariant?: React.ComponentProps<typeof Bubble>['variant'];
  message: IMessage;
  previousMessage?: IMessage;
  user?: IDevice | null;
  userVariant?: React.ComponentProps<typeof Bubble>['variant'];
  isUserMessage?: boolean;
}) {
  const isNewMessage = useMessageAnimationStore((s) => s.has(message.uuid));
  const shouldReduceMotion = useReducedMotion();

  const shouldAnimate = isNewMessage && !shouldReduceMotion;

  return (
    <MotionMessageScrollerItem
      messageId={message.uuid}
      scrollAnchor={scrollAnchor ?? true}
      variants={animationPreset.variants}
      animate='animate'
      initial={shouldAnimate ? 'initial' : false}
      exit={shouldAnimate ? 'exit' : undefined}
      onAnimationComplete={() => {
        useMessageAnimationStore.getState().remove(message.uuid);
      }}
      {...props}
    >
      <MessageAnimatedRow
        message={message}
        previousMessage={previousMessage}
        user={user}
        isUserMessage={isUserMessage}
        assistantVariant={assistantVariant}
        userVariant={userVariant}
      />
    </MotionMessageScrollerItem>
  );
}

function MessageAnimatedRow({
  message,
  previousMessage,
  assistantVariant,
  userVariant,
  isUserMessage = false,
  user,
}: {
  assistantVariant: React.ComponentProps<typeof Bubble>['variant'];
  message: IMessage;
  previousMessage?: IMessage;
  user?: IDevice | null;
  userVariant: React.ComponentProps<typeof Bubble>['variant'];
  isUserMessage?: boolean;
}) {
  const textMessageRef = useRef<MessageContextMenuRef>(null);

  const confirm = useConfirm();

  const renderMessage = () => {
    if (message.type === 'text') {
      return <TextMessage ref={textMessageRef} message={message} />;
    }

    if (message.type === 'image') {
      return <ImageMessage message={message} />;
    }

    if (message.type === 'video') {
      return <VideoMessage message={message} />;
    }

    return null;
  };

  const align = isUserMessage ? 'end' : 'start';

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
    <>
      {isNewDay && (
        <div className='flex items-center justify-center pt-3 text-xs font-normal'>
          {renderTime(message.createdAt)}
        </div>
      )}
      <Message
        align={align}
        className={cn(
          'relative px-4 pb-1',
          isSameUser && !isNewGroup ? 'pt-1' : 'pt-4',
        )}
      >
        <MessageAvatar className='min-w-10 self-start'>
          {isNewGroup && (
            <Avatar size='lg'>
              <AvatarImage
                className='rounded-full'
                src={resolveResourceUrl(user?.avatar)}
                alt={user?.name ?? 'avatar'}
              />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
          )}
        </MessageAvatar>
        <MessageContent>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <Bubble
                className='max-w-[90%]'
                variant={isUserMessage ? userVariant : assistantVariant}
              >
                <BubbleContent className='editor-shell overflow-x-auto'>
                  <MessageExpandable>{renderMessage()}</MessageExpandable>
                </BubbleContent>
              </Bubble>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuGroup>
                <ContextMenuItem
                  onSelect={async () => {
                    if (message.type === 'text' && textMessageRef.current) {
                      await textMessageRef.current.onCopy();
                    }
                  }}
                >
                  <CopyIcon />
                  Copy
                </ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem
                  variant='destructive'
                  onSelect={async () => {
                    const ok = await confirm({
                      icon: <TrashIcon />,
                      title: 'Delete message?',
                      description:
                        'This will permanently delete this message from the database. This action cannot be undone, and the message will also be removed from the other device.',
                      confirmText: 'Delete',
                      actionVariant: 'destructive',
                    });

                    if (ok) {
                      const current = useDeviceStore.getState().current;
                      if (!current?.id) return;

                      useIMStore
                        .getState()
                        .deleteMessage(
                          useIMStore.getState().activeDeviceId,
                          message.uuid,
                        );
                      try {
                        await deleteMessage(current.id, message.uuid);
                      } catch {
                        // TODO 删除消息失败
                      }
                    }
                  }}
                >
                  <TrashIcon />
                  Delete
                </ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
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
    </>
  );
}

export { MessageAnimatedWrapper };
