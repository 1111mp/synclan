import { ClipboardDOMImportExtension } from '@lexical/clipboard';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoFocusExtension, ClearEditorExtension } from '@lexical/extension';
import { HistoryExtension } from '@lexical/history';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { HeadingNode, QuoteNode, RichTextExtension } from '@lexical/rich-text';
import {
  $nodesOfType,
  CLEAR_EDITOR_COMMAND,
  defineExtension,
  LineBreakNode,
  ParagraphNode,
} from 'lexical';
import { CaseSensitive, Maximize2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';

import {
  CompositionInput,
  EmojiButton,
  type CompositionInputProps,
  type CompositionInputRef,
} from '@/components';
import {
  DragDropPasteExtension,
  ImagesExtension,
} from '@/components/extensions';
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';

import {
  $createCodePlusNode,
  $createSimpleListItemNode,
  $createSimpleListNode,
  $createSimpleQuoteNode,
  CodePlusNode,
  EmojiNode,
  ImageNode,
  SimpleListItemNode,
  SimpleListNode,
  SimpleQuoteNode,
} from './nodes';
import {
  $isEmpty,
  CodeHighlightExtension,
  FixedTextFormatToolbar,
} from './plugins';

export const SynclanEditorExtension = defineExtension({
  dependencies: [
    AutoFocusExtension,
    RichTextExtension,
    HistoryExtension,
    ClearEditorExtension,
    CodeHighlightExtension,
    ImagesExtension,
    DragDropPasteExtension,
    ClipboardDOMImportExtension,
  ],
  name: 'synclan-editor',
  namespace: 'synclan-editor',
  nodes: [
    AutoLinkNode,
    LinkNode,
    SimpleListNode,
    {
      replace: ListNode,
      with: (node: ListNode) =>
        $createSimpleListNode(node.getListType(), node.getStart()),
      withKlass: SimpleListNode,
    },
    SimpleListItemNode,
    {
      replace: ListItemNode,
      with: (node: ListItemNode) =>
        $createSimpleListItemNode(node.getChecked()),
      withKlass: SimpleListItemNode,
    },
    ParagraphNode,
    HeadingNode,
    SimpleQuoteNode,
    {
      replace: QuoteNode,
      with: () => $createSimpleQuoteNode(),
      withKlass: SimpleQuoteNode,
    },
    CodePlusNode,
    {
      replace: CodeNode,
      with: (node: CodeNode) =>
        $createCodePlusNode(node.getLanguage(), node.getTheme()),
      withKlass: CodePlusNode,
    },
    CodeHighlightNode,
    EmojiNode,
    LineBreakNode,
    ImageNode,
  ],
  theme: {
    code: 'block relative pt-7 pb-4 pl-[72px] pr-2 my-2 border rounded-md indent-0 before:box-border before:absolute before:top-0 before:left-0 before:content-[attr(data-gutter)] before:w-14 before:pt-[29px] before:px-2 before:pb-0 before:font-thin before:text-right',
    paragraph: 'mt-0 mb-0',
    link: 'font-light text-blue-500 no-underline cursor-pointer hover:underline',
    list: {
      ul: 'mt-0 mb-0 pl-0 list-outside marker:text-blue-500',
      ulDepth: ['list-disc', 'list-[circle]', 'list-[square]'],
      ol: 'mt-0 mb-0 pl-0 list-outside marker:text-blue-500 ',
      olDepth: ['list-decimal', 'list-[lower-alpha]', 'list-[lower-roman]'],
      listitem: 'mt-0 mb-0 ml-4 pl-2',
      nested: {
        listitem: 'ml-6 list-none',
      },
    },
    quote: 'm-0 pl-2 text-gray-400 border-l-2 border-input overflow-hidden',
    text: {
      bold: 'font-bold',
      strikethrough: 'line-through',
      italic: 'italic',
      underline: 'underline',
      underlineStrikethrough: '[text-decoration-line:underline_line-through]',
    },
    image: 'editor-image',
  },
});

function Transmitter({ onSend }: { onSend?: CompositionInputProps['onSend'] }) {
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const [focused, setFocueed] = useState<boolean>(true);
  const [lineOverflow, setLineOverflow] = useState<boolean>(false);
  const [isFixedTools, setIsFixedTools] = useState<boolean>(false);
  const [_isFulled, setIsFulled] = useState<boolean>(false);

  const compositionInputRef = useRef<CompositionInputRef>(null);

  // const initialConfig = useMemo<InitialConfigType>(
  //   () => ({
  //     ...EDITOR_INITIAL_CONFIG,
  //     onError(error) {
  //       console.log('error', error);
  //     },
  //   }),
  //   [],
  // );

  const multiLine = lineOverflow || isFixedTools;

  return (
    <LexicalExtensionComposer
      extension={SynclanEditorExtension}
      contentEditable={null}
    >
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
              setIsEmpty(empty);
            }}
            onFocusChange={(focus) => {
              setFocueed(focus);
            }}
            onSend={async (content, attachments) => {
              if (isEmpty) return;
              await onSend?.(content, attachments);
            }}
          />
        </div>
        <div className={cn('flex items-center ml-auto', multiLine && 'w-full')}>
          <div className='flex-1'>
            {isFixedTools && (
              <FixedTextFormatToolbar onSetIsLinkEditMode={() => {}} />
            )}
          </div>
          <ul className={cn('flex items-center pl-4 pr-3 py-2 gap-1')}>
            <li className='flex items-center'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className={cn(
                      'text-muted-foreground hover:text-muted-foreground',
                      isFixedTools &&
                        'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className='text-muted-foreground hover:text-muted-foreground'
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
            <li className='flex items-center'>
              <Tooltip>
                <TooltipTrigger asChild>
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
                        return $isEmpty();
                      });
                      if (empty) return;

                      const content = JSON.stringify(
                        editor.getEditorState().toJSON(),
                      );
                      editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
                      await onSend?.(content, attachments);
                    }}
                  >
                    <svg
                      className={cn(
                        'size-5',
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
      </div>
      <AnimatePresence>
        {!isEmpty && focused && (
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
    </LexicalExtensionComposer>
  );
}

export { Transmitter };
