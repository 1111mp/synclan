import { useEffect, useRef, useState } from 'react';
import { LineBreakNode, ParagraphNode } from 'lexical';
import {
  LexicalComposer,
  type InitialConfigType,
} from '@lexical/react/LexicalComposer';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { CaseSensitive, Maximize2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CompositionInput,
  EmojiButton,
  type CompositionInputRef,
} from '@/components';
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { useLatestRef } from '@/hooks';
import { FixedTextFormatToolbar } from './plugins';
import {
  $createCodePlusNode,
  $createSimpleListItemNode,
  $createSimpleListNode,
  $createSimpleQuoteNode,
  CodePlusNode,
  EmojiNode,
  SimpleListItemNode,
  SimpleListNode,
  SimpleQuoteNode,
} from './nodes';
import { cn } from '@/lib/utils';

type Props = {
  onLineOverflow?: () => void;
};

function Transmitter({ onLineOverflow }: Props) {
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const [focused, setFocueed] = useState<boolean>(true);
  const [lineOverflow, setLineOverflow] = useState<boolean>(false);
  const [isFixedTools, setIsFixedTools] = useState<boolean>(false);
  const [_isFulled, setIsFulled] = useState<boolean>(false);

  const compositionInputRef = useRef<CompositionInputRef>(null);
  // const toolsFixedContainer = useRef<HTMLDivElement>(null);

  const latestonLineOverflow = useLatestRef(onLineOverflow);

  useEffect(() => {
    latestonLineOverflow.current?.();
  }, [lineOverflow, latestonLineOverflow]);

  const initialConfig: InitialConfigType = {
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
    ],
    theme: {
      code: 'block relative pt-7 pb-4 pl-[72px] pr-2 my-2 border rounded-md bg-muted! text-muted-foreground! indent-0 before:box-border before:absolute before:top-0 before:left-0 before:content-[attr(data-gutter)] before:w-14 before:pt-[29px] before:px-2 before:pb-0 before:font-thin before:text-right',
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
    },
    onError(error) {
      console.log('error', error);
    },
  };

  const multiLine = lineOverflow || isFixedTools;

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className='mx-4 mb-5'>
        <div
          className={cn(
            'flex flex-wrap border rounded-lg bg-card',
            multiLine && 'flex-col flex-nowrap',
          )}
        >
          <div
            className={cn(
              'flex-[1_1_auto] max-w-full mt-2.5',
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
            />
          </div>
          <div
            className={cn('flex items-center ml-auto', multiLine && 'w-full')}
          >
            <div className='flex-1'>
              {isFixedTools && (
                <FixedTextFormatToolbar onSetIsLinkEditMode={() => {}} />
              )}
            </div>
            <ul className={cn('flex items-center pl-4 pr-3 py-2 space-x-1')}>
              <li className='flex items-center'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className={cn(
                        'text-muted-foreground hover:text-muted-foreground',
                        isFixedTools &&
                          'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
                      )}
                      size='xs'
                      variant='ghost'
                      onClick={() => {
                        setIsFixedTools((f) => !f);
                      }}
                    >
                      <CaseSensitive className='size-5.5 mt-0.5' />
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
                      size='xs'
                      variant='ghost'
                      onClick={() => {
                        setIsFulled((f) => !f);
                      }}
                    >
                      <Maximize2 className='size-4.5' strokeWidth={2.5} />
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
    </LexicalComposer>
  );
}

export { Transmitter };
