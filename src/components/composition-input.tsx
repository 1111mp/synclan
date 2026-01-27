import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  LineBreakNode,
  ParagraphNode,
} from 'lexical';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';
import { $generateHtmlFromNodes } from '@lexical/html';
import {
  LexicalComposer,
  type InitialConfigType,
} from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import {
  createEmptyHistoryState,
  HistoryPlugin,
  type HistoryState,
} from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import {
  AutoLinePlugin,
  CodeHighlightShikiPlugin,
  CodeNodeToolbarPlugin,
  CodeBehaviorPlugin,
  EmojiPickerPlugin,
  EnterBehaviorPlugin,
  IsEmptyPlugin,
  IsFocusedPlugin,
  FixEmptyQuoteAfterDeletePlugin,
  FloatingTextFormatToolbarPlugin,
  LinkPlugin,
  ShortcutsPlugin,
  FixTextFormatPlugin,
  OrderedListRecomputePlugin,
  EmptyBlockToParagraphPlugin,
  type AutoLinePluginProps,
  type IsEmptyPluginProps,
  type IsFocusedPluginProps,
} from './plugins';
import {
  CODE_PLUS,
  ELEMENT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from './transformers';
import {
  $createCodePlusNode,
  $createSimpleListNode,
  CodePlusNode,
  SimpleListNode,
  $createEmojiNode,
  EmojiNode,
  SimpleListItemNode,
  $createSimpleListItemNode,
  SimpleQuoteNode,
  $createSimpleQuoteNode,
} from './nodes';

import type { EditorState, LexicalEditor } from 'lexical';
import type { EmojiPickerProps } from './emoji';
import { cn } from '@/lib/utils';

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

type CompositionInputProps = {
  ref?: Ref<CompositionInputRef>;
  onEmptyChange?: IsEmptyPluginProps['onChange'];
  onFocusChange?: IsFocusedPluginProps['onFocusChange'];
  onLineChange?: AutoLinePluginProps['onLineChange'];
};

type CompositionInputRef = {
  onPickEmoji: EmojiPickerProps['onPickEmoji'];
};

function CompositionInput({
  ref,
  onEmptyChange,
  onFocusChange,
  onLineChange,
}: CompositionInputProps) {
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const editorRef = useRef<LexicalEditor>(null);
  const historyState = useRef<HistoryState>(createEmptyHistoryState());

  useImperativeHandle(ref, () => ({
    onPickEmoji: onPickEmojiHandle,
  }));

  const onPickEmojiHandle: EmojiPickerProps['onPickEmoji'] = ({
    shortName,
    skinTone,
  }) => {
    if (!editorRef.current) return;

    editorRef.current.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      selection.insertNodes([$createEmojiNode(shortName, skinTone)]);
    });
  };

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
        ul: 'mt-0 mb-0 pl-0 list-outside indent-2 marker:text-blue-500',
        ulDepth: ['list-disc', 'list-[circle]', 'list-[square]'],
        ol: 'mt-0 mb-0 pl-0 list-outside indent-2 marker:text-blue-500 ',
        olDepth: ['list-decimal', 'list-[lower-alpha]', 'list-[lower-roman]'],
        listitem: 'mt-0 mb-0 ml-4',
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

  const onChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      console.log('HTML:', htmlString);
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        id='synclan-composition-scroll-wrapper'
        className='relative px-3 max-h-56 overflow-y-auto scrollbar-color dark:scrollbar-color'
      >
        <ShortcutsPlugin />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className={cn(
                'w-full max-w-none text-sm leading-5 text-foreground outline-none focus:outline-none',
              )}
              aria-placeholder='Enter Message'
              placeholder={
                <p className='inline-block absolute top-0 text-sm text-muted-foreground select-none pointer-events-none'>
                  发送消息
                </p>
              }
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <EditorRefPlugin editorRef={editorRef} />
        <HistoryPlugin externalHistoryState={historyState.current} />
        <AutoFocusPlugin />
        <AutoLinkPlugin
          matchers={[
            (text) => {
              const match = URL_MATCHER.exec(text);
              if (match === null) {
                return null;
              }

              const fullMatch = match[0];
              return {
                index: match.index,
                length: fullMatch.length,
                text: fullMatch,
                url: fullMatch.startsWith('http')
                  ? fullMatch
                  : `https://${fullMatch}`,
                attributes: {
                  rel: 'noreferrer',
                  target: '_blank',
                },
              };
            },
          ]}
        />
        <LinkPlugin
          hasLinkAttributes={true}
          historyState={historyState.current}
        />
        <MarkdownShortcutPlugin
          transformers={[
            ...ELEMENT_TRANSFORMERS,
            ...TEXT_MATCH_TRANSFORMERS,
            CODE_PLUS,
          ]}
        />
        <CodeHighlightShikiPlugin />
        <CodeNodeToolbarPlugin />
        <CodeBehaviorPlugin />
        <FixTextFormatPlugin />
        <OrderedListRecomputePlugin />
        <EmptyBlockToParagraphPlugin />
        <FloatingTextFormatToolbarPlugin
          setIsLinkEditMode={setIsLinkEditMode}
        />
        <ListPlugin hasStrictIndent={false} />
        <TabIndentationPlugin maxIndent={3} />
        <FixEmptyQuoteAfterDeletePlugin />
        <EmojiPickerPlugin />
        <AutoLinePlugin onLineChange={onLineChange} />
        <IsEmptyPlugin onChange={onEmptyChange} />
        <IsFocusedPlugin onFocusChange={onFocusChange} />
        <OnChangePlugin onChange={onChange} />
        <EnterBehaviorPlugin
          onSend={() => {
            console.log('onSend');
          }}
        />
      </div>
    </LexicalComposer>
  );
}

export {
  CompositionInput,
  type CompositionInputProps,
  type CompositionInputRef,
};
