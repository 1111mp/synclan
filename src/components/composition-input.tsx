import { ParagraphNode } from 'lexical';
import { CodeNode } from '@lexical/code';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TRANSFORMERS } from '@lexical/markdown';
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
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ClearSelectionPlugin, EmojiPickerPlugin } from './plugins';

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
    ],
    theme: {
      link: 'text-blue-500',
      list: {
        ul: 'list-inside marker:text-blue-500',
        ulDepth: ['list-disc', 'list-[circle]', 'list-[square]'],
        ol: 'list-inside marker:text-blue-500',
        olDepth: ['list-decimal', 'list-[lower-alpha]', 'list-[lower-roman]'],
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
    <div>
      <LexicalComposer initialConfig={initialConfig}>
        <div className='relative'>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className='min-h-40 prose outline-none focus:outline-none'
                aria-placeholder='Enter Message'
                placeholder={
                  <p className='inline-block absolute top-0.5 text-gray-45 select-none pointer-events-none'>
                    Enter Message
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
          <OnChangePlugin onChange={onChange} />
        </div>
      </LexicalComposer>
    </div>
  );
}

export { CompositionInput };
