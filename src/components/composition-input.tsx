import { useImperativeHandle, useRef, type Ref } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  LineBreakNode,
  ParagraphNode,
} from 'lexical';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import {
  ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from '@lexical/markdown';
import { ListNode, ListItemNode } from '@lexical/list';
import { $generateHtmlFromNodes } from '@lexical/html';
import {
  LexicalComposer,
  type InitialConfigType,
} from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
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
  ClearSelectionPlugin,
  CodeHighlightShikiPlugin,
  CodeNodeToolbarPlugin,
  CodeBehaviorPlugin,
  EmojiPickerPlugin,
  EnterBehaviorPlugin,
  IsEmptyPlugin,
  IsFocusedPlugin,
  FloatingTextFormatToolbarPlugin,
  type AutoLinePluginProps,
  type IsEmptyPluginProps,
  type IsFocusedPluginProps,
} from './plugins';
import { CODE_PLUS } from './transformers';
import {
  $createCodePlusNode,
  $createSimpleListNode,
  CodePlusNode,
  SimpleListNode,
  $createEmojiNode,
  EmojiNode,
} from './nodes';

import type { EditorState, LexicalEditor } from 'lexical';
import type { EmojiPickerProps } from './emoji';

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
  const editorRef = useRef<LexicalEditor>(null);

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

      // selection.insertNodes([$createEmojiNode(shortName, skinTone)]);
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
      ListItemNode,
      ParagraphNode,
      HeadingNode,
      QuoteNode,
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
      code: 'block relative pt-7 pb-4 pl-[72px] pr-2 my-2 border rounded-md bg-muted! text-muted-foreground! before:absolute before:top-0 before:left-0 before:content-[attr(data-gutter)] before:p-2 before:pt-[29px] before:pl-8 before:min-w-6 before:font-thin',
      paragraph: 'mt-0 mb-0',
      link: 'font-light text-blue-500 no-underline',
      list: {
        ul: 'mt-0 mb-0 pl-0 list-outside indent-2 marker:text-blue-500',
        ulDepth: ['list-disc', 'list-[circle]', 'list-[square]'],
        ol: 'list-inside indent-2 marker:text-blue-500 *:ml-0!',
        olDepth: ['list-decimal', 'list-[lower-alpha]', 'list-[lower-roman]'],
        listitem: 'mt-0 mb-0 ml-4',
        nested: {
          listitem: 'ml-6 list-none',
        },
      },
      quote: 'm-0 pl-2 text-gray-300 border-l-2 border-input',
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
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className='w-full max-w-none text-sm leading-5 text-foreground outline-none focus:outline-none'
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
        <HistoryPlugin />
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
        <MarkdownShortcutPlugin
          transformers={[
            ...ELEMENT_TRANSFORMERS,
            ...TEXT_FORMAT_TRANSFORMERS,
            ...TEXT_MATCH_TRANSFORMERS,
            ...[CODE_PLUS],
          ]}
        />
        <CodeHighlightShikiPlugin />
        <CodeNodeToolbarPlugin />
        <CodeBehaviorPlugin />
        <FloatingTextFormatToolbarPlugin />
        <ListPlugin hasStrictIndent={false} />
        <TabIndentationPlugin maxIndent={3} />
        <ClearSelectionPlugin />
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
