import { AutoFocusExtension } from '@lexical/extension';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import {
  $getRoot,
  $nodesOfType,
  CLEAR_EDITOR_COMMAND,
  defineExtension,
} from 'lexical';
import { CaseSensitive } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react';

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
  // const [_isFulled, setIsFulled] = useState<boolean>(false);

  const compositionInputRef = useRef<CompositionInputRef>(null);
  const shiftEnterHintRef = useRef<ShiftEnterHintRef>(null);

  const isMobile = useIsMobile();

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
        className={cn(
          // 'transition-all duration-300',
          !isEmpty && 'bg-primary/30 hover:bg-primary/30!',
        )}
        size='sm'
        variant='ghost'
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
          className={cn('size-5', isEmpty ? 'text-input' : 'text-primary')}
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

  const multiLine = lineOverflow || isFixedTools;

  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <div
        className={cn(
          'flex flex-wrap border rounded-lg bg-card/60 backdrop-blur-sm',
          multiLine && 'flex-col flex-nowrap',
        )}
      >
        <div
          className={cn(
            'editor-shell flex-[1_1_auto] max-w-full mt-2.5',
            multiLine && 'w-full',
          )}
        >
          <CompositionInput
            ref={compositionInputRef}
            isFixedTools={isFixedTools}
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
        </div>
        <div className={cn('flex items-center ml-auto', multiLine && 'w-full')}>
          <div className='flex-1'>
            {!isMobile && isFixedTools && (
              <FixedTextFormatToolbar onSetIsLinkEditMode={() => {}} />
            )}
          </div>
          <ul className={cn('flex items-center pl-4 pr-3 py-2')}>
            {!isMobile && (
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
                  <TooltipContent>显示格式工具栏</TooltipContent>
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
            {/*{!isMobile && (
              <li className='flex items-center'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className='text-muted-foreground hover:text-muted-foreground px-1.5'
                      size='sm'
                      variant='ghost'
                      onClick={() => {
                        setIsFulled((f) => !f);
                      }}
                    >
                      <Maximize2 className='size-4' strokeWidth={3} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>展开</TooltipContent>
                </Tooltip>
              </li>
            )}*/}
            {!isMobile && (
              <li className='ml-1 flex items-center'>
                {isMobile ? (
                  renderSend()
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>{renderSend()}</TooltipTrigger>
                    <TooltipContent>发送(Enter)</TooltipContent>
                  </Tooltip>
                )}
              </li>
            )}
          </ul>
        </div>
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
  const [focused, setFocused] = useState<boolean>(false);
  const [isEmpty, setEmpty] = useState<boolean>(false);

  useImperativeHandle(ref, () => ({
    focus: focusHandler,
    empty: emptyHandler,
  }));

  const focusHandler = (value: boolean) => {
    setFocused(value);
  };

  const emptyHandler = (value: boolean) => {
    setEmpty(value);
  };

  return (
    <AnimatePresence>
      {!isMobile && !isEmpty && focused && (
        <motion.p
          className='absolute right-4 bottom-0 text-[10px]'
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          exit={{ opacity: 0 }}
        >
          Shift + Enter 换行
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export { Transmitter };
