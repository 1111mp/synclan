import { ParagraphNode } from 'lexical';
import { CodeNode } from '@lexical/code';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TRANSFORMERS } from '@lexical/markdown';
import { ListNode, ListItemNode } from '@lexical/list';
import { $generateHtmlFromNodes } from '@lexical/html';
import { EmojiNode } from './emoji';
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
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import {
  AutoLinePlugin,
  ClearSelectionPlugin,
  EmojiPickerPlugin,
  EnterPlugin,
} from './plugins';

import type { EditorState, LexicalEditor } from 'lexical';

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

function CompositionInput() {
  const initialConfig: InitialConfigType = {
    namespace: 'synclan-editor',
    nodes: [
      AutoLinkNode,
      LinkNode,
      ListNode,
      ListItemNode,
      ParagraphNode,
      HeadingNode,
      QuoteNode,
      CodeNode,
      EmojiNode,
    ],
    theme: {
      paragraph: 'mt-0 mb-0',
      link: 'text-blue-500',
      list: {
        ul: 'mt-0 mb-0 pl-0 list-inside marker:text-blue-500',
        ulDepth: ['list-disc', 'list-[circle]', 'list-[square]'],
        ol: 'list-inside marker:text-blue-500',
        olDepth: ['list-decimal', 'list-[lower-alpha]', 'list-[lower-roman]'],
        listitem: 'mt-0 mb-0',
        nested: {
          listitem: 'ml-6 list-none',
        },
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
      <div className='relative'>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className='w-full prose max-w-none text-sm leading-5 text-foreground outline-none focus:outline-none'
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
        <ListPlugin hasStrictIndent={false} />
        <TabIndentationPlugin maxIndent={3} />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <ClearSelectionPlugin />
        <EmojiPickerPlugin />
        <AutoLinePlugin />
        <OnChangePlugin onChange={onChange} />
        <EnterPlugin
          onSend={() => {
            console.log('onSend');
          }}
        />
      </div>
    </LexicalComposer>
  );
}

export { CompositionInput };
