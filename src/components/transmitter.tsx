import {
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import { AutoFocusExtension } from '@lexical/extension';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import {
  $getRoot,
  $nodesOfType,
  CLEAR_EDITOR_COMMAND,
  defineExtension,
} from 'lexical';
import { CaseSensitive, Maximize2, Minimize2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  CompositionInput,
  EmojiButton,
  type CompositionInputProps,
  type CompositionInputRef,
} from '@/components';
import { SynclanEditorExtension } from '@/components/extensions';
import { ImageNode } from '@/components/nodes';
import { $isEmpty, FixedTextFormatToolbar } from '@/components/plugins';
import {
  TransmitterMoreMenu,
  type TransmitterMoreMenuProps,
} from '@/components/transmitter-more-menu';
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { useIsMobile } from '@/hooks';
import { cn } from '@/lib/utils';

const AnimatedOverlay = motion.create(FloatingOverlay);

function Transmitter({
  onSend,
  onSelectFile,
  onSelectMedia,
}: {
  onSend?: CompositionInputProps['onSend'];
  onSelectFile?: TransmitterMoreMenuProps['onSelectFile'];
  onSelectMedia?: TransmitterMoreMenuProps['onSelectMedia'];
}) {
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const [lineOverflow, setLineOverflow] = useState<boolean>(false);
  const [isFixedTools, setIsFixedTools] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLifted, setIsLifted] = useState(false);
  const { refs, context } = useFloating({
    open: isExpanded,
    onOpenChange: setIsExpanded,
  });
  const dismiss = useDismiss(context, {
    // Only the local backdrop dismisses: editor menus may render in their own portals.
    outsidePress: (event) =>
      event.target instanceof Element &&
      event.target.hasAttribute('data-composer-overlay'),
  });
  const { getFloatingProps } = useInteractions([dismiss]);
  const reduceMotion = useReducedMotion();
  const [collapsedHeight, setCollapsedHeight] = useState<number>();
  const [closingHeight, setClosingHeight] = useState<number>();
  const composerContainerRef = useRef<HTMLDivElement>(null);

  const compositionInputRef = useRef<CompositionInputRef>(null);
  const shiftEnterHintRef = useRef<ShiftEnterHintRef>(null);

  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const extension = useMemo(
    () =>
      defineExtension({
        dependencies: [AutoFocusExtension, SynclanEditorExtension],
        name: 'synclan-editor',
        namespace: 'synclan-editor',
      }),
    [],
  );

  const renderSend = () => {
    return (
      <Button
        disabled={isEmpty}
        size='sm'
        variant={isEmpty ? 'secondary' : 'default'}
        onClick={async () => {
          if (isEmpty) return;

          const editor = compositionInputRef.current?.getEditor();
          if (!editor) return;

          const attachments: Attachment[] = [];
          let plainContent: string | undefined;
          const empty = editor.getEditorState().read(() => {
            const nodes = $nodesOfType(ImageNode);
            nodes.forEach((node) => {
              if (node.__attachmentId) {
                attachments.push({
                  id: node.__attachmentId,
                  src: node.getSrc(),
                  name: node.__altText,
                });
              }
            });
            plainContent = $getRoot().getTextContent();
            return $isEmpty();
          });
          if (empty) return;

          const content = JSON.stringify(editor.getEditorState().toJSON());
          editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
          await onSend?.({ content, plainContent, attachments });
        }}
      >
        <svg
          className='size-5'
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='currentColor'
          shapeRendering='crispEdges'
        >
          <path d='M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z' />
        </svg>
      </Button>
    );
  };

  const toggleExpanded = () => {
    if (!isExpanded && !isLifted) {
      setCollapsedHeight(
        composerContainerRef.current?.getBoundingClientRect().height,
      );
      setIsLifted(true);
    }
    setIsExpanded((expanded) => !expanded);
  };

  useLayoutEffect(() => {
    if (isExpanded || !isLifted) return;
    const panel = composerContainerRef.current?.firstElementChild;
    if (!(panel instanceof HTMLElement)) return;

    // Measure the restored compact layout before paint, without exposing the
    // temporary auto height. Animate to pixels so completion cannot remeasure it.
    const previousHeight = panel.style.height;
    panel.style.height = 'auto';
    const height = panel.getBoundingClientRect().height;
    panel.style.height = previousHeight;
    setClosingHeight(height);
  }, [isExpanded, isLifted, lineOverflow, isFixedTools]);

  const overlayHost = composerContainerRef.current?.closest<HTMLElement>(
    '#synclan-device-message-list',
  );
  const transition = {
    duration: reduceMotion ? 0 : isExpanded ? 0.3 : 0.22,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  // Restore the compact children before measuring the closing height. The lifted
  // shell stays in place until the animation ends, keeping the message list still.
  const multiLine = lineOverflow || isFixedTools || isExpanded;

  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      {overlayHost && (
        <FloatingPortal root={overlayHost} preserveTabOrder={false}>
          <AnimatePresence>
            {isExpanded && (
              <AnimatedOverlay
                data-composer-overlay=''
                style={{ position: 'absolute' }}
                className='z-10 bg-black/40'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition}
              />
            )}
          </AnimatePresence>
        </FloatingPortal>
      )}
      <div
        ref={composerContainerRef}
        className={cn('relative', isLifted && 'z-20')}
        style={isLifted ? { height: collapsedHeight } : undefined}
      >
        <motion.div
          ref={refs.setFloating}
          {...getFloatingProps()}
          initial={false}
          animate={{
            height: isExpanded
              ? '85dvh'
              : isLifted
                ? (closingHeight ?? collapsedHeight)
                : 'auto',
          }}
          transition={isLifted ? transition : { duration: 0 }}
          onAnimationComplete={() => {
            if (!isExpanded && isLifted && closingHeight !== undefined) {
              setIsLifted(false);
              setClosingHeight(undefined);
            }
          }}
          className={cn(
            'rounded-lg border bg-card shadow-(--composer-shadow) transition-[border-color,box-shadow] duration-180 ease-in-out motion-reduce:transition-none',
            isLifted &&
              'absolute inset-x-0 bottom-0 max-h-[calc(100dvh-2rem)] overflow-hidden',
          )}
        >
          <div
            className={cn(
              'flex w-full flex-wrap',
              multiLine && 'flex-col flex-nowrap',
              isExpanded && 'h-full',
              isLifted && !isExpanded && 'pointer-events-none',
            )}
          >
            {isExpanded && (
              <div className='flex shrink-0 items-center justify-between gap-2 border-b py-2 pr-3 pl-1'>
                <FixedTextFormatToolbar
                  className='p-0'
                  onSetIsLinkEditMode={() => {}}
                />
                <Button
                  size='sm'
                  variant='ghost'
                  aria-label={t('transmitter.collapse')}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={toggleExpanded}
                >
                  <Minimize2 className='size-5' strokeWidth={3} />
                </Button>
              </div>
            )}
            <motion.div
              layout={reduceMotion ? false : 'position'}
              transition={transition}
              className={cn(
                'editor-shell flex-[1_1_auto] max-w-full mt-3',
                multiLine && 'w-full',
                isExpanded && 'min-h-0 flex-1',
                isLifted && !isExpanded && multiLine && 'flex-none',
              )}
            >
              <CompositionInput
                ref={compositionInputRef}
                isFixedTools={isFixedTools || isExpanded}
                isExpanded={isExpanded}
                onLineChange={(changed) => {
                  setLineOverflow(changed);
                }}
                onEmptyChange={(empty) => {
                  shiftEnterHintRef.current?.empty(empty);
                  setIsEmpty(empty);
                }}
                onFocusChange={(focus) => {
                  shiftEnterHintRef.current?.focus(focus);
                }}
                onSend={async (data) => {
                  if (isEmpty) return;
                  await onSend?.(data);
                }}
              />
            </motion.div>
            <motion.div
              initial={false}
              animate={{ opacity: isLifted && !isExpanded ? 0 : 1 }}
              transition={{
                duration: reduceMotion || (isLifted && !isExpanded) ? 0 : 0.12,
              }}
              className={cn(
                'flex shrink-0 items-center ml-auto',
                multiLine && 'w-full',
              )}
            >
              <div className='flex-1'>
                {!isMobile && isFixedTools && !isExpanded && (
                  <FixedTextFormatToolbar onSetIsLinkEditMode={() => {}} />
                )}
              </div>
              <ul className={cn('flex items-center pl-4 pr-3 py-2.5')}>
                {!isMobile && !isExpanded && (
                  <li className='flex items-center'>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          className={cn(
                            'px-1.5 text-muted-foreground hover:text-muted-foreground',
                            isFixedTools &&
                              'bg-primary/10 text-primary hover:bg-primary/10! hover:text-primary!',
                          )}
                          size='sm'
                          variant='ghost'
                          onClick={() => {
                            setIsFixedTools((f) => !f);
                          }}
                        >
                          <CaseSensitive className='size-6' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('transmitter.showFormattingToolbar')}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                )}
                <li className='flex items-center'>
                  <EmojiButton
                    onPickEmoji={({ shortName, skinTone }) => {
                      compositionInputRef.current?.onPickEmoji?.({
                        shortName,
                        skinTone,
                      });
                    }}
                  />
                </li>
                <li className='flex items-center'>
                  <TransmitterMoreMenu
                    onSelectFile={onSelectFile}
                    onSelectMedia={onSelectMedia}
                  />
                </li>
                {!isMobile && !isExpanded && (
                  <li className='flex items-center'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className='text-muted-foreground hover:text-muted-foreground px-1.5'
                          size='sm'
                          variant='ghost'
                          aria-label={t(
                            isExpanded
                              ? 'transmitter.collapse'
                              : 'transmitter.expand',
                          )}
                          aria-expanded={isExpanded}
                          aria-controls='synclan-composition-scroll-wrapper'
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            toggleExpanded();
                          }}
                        >
                          {isExpanded ? (
                            <Minimize2 className='size-5' strokeWidth={3} />
                          ) : (
                            <Maximize2 className='size-5' strokeWidth={3} />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t(
                          isExpanded
                            ? 'transmitter.collapse'
                            : 'transmitter.expand',
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                )}
                {!isMobile && (
                  <li className='ml-1 flex items-center'>
                    {isMobile ? (
                      renderSend()
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>{renderSend()}</TooltipTrigger>
                        <TooltipContent>{t('transmitter.send')}</TooltipContent>
                      </Tooltip>
                    )}
                  </li>
                )}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </div>
      <ShiftEnterHint ref={shiftEnterHintRef} isMobile={isMobile} />
    </LexicalExtensionComposer>
  );
}

type ShiftEnterHintRef = {
  empty(value: boolean): void;
  focus(value: boolean): void;
};

function ShiftEnterHint({
  ref,
  isMobile,
}: {
  ref: Ref<ShiftEnterHintRef>;
  isMobile: boolean;
}) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [isEmpty, setEmpty] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: setFocused,
    empty: setEmpty,
  }));

  return (
    <AnimatePresence>
      {!isMobile && !isEmpty && focused && (
        <motion.p
          className='absolute right-7 bottom-1.5 text-[10px]'
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          exit={{ opacity: 0 }}
        >
          {t('transmitter.newLineHint')}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export { Transmitter };
