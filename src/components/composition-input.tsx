import { $generateHtmlFromNodes } from '@lexical/html';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import {
  createEmptyHistoryState,
  HistoryPlugin,
  type HistoryState,
} from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import {
  $getSelection,
  $isRangeSelection,
  type EditorState,
  type LexicalEditor,
} from 'lexical';
import { useImperativeHandle, useRef, useState, type Ref } from 'react';

import { cn } from '@/lib/utils';

import { type EmojiPickerProps } from './emoji';
import { $createEmojiNode } from './nodes';
import {
  AutoLinePlugin,
  CodeBehaviorPlugin,
  CodeHighlightShikiPlugin,
  CodeNodeToolbarPlugin,
  EmojiPickerPlugin,
  EmptyBlockToParagraphPlugin,
  EnterBehaviorPlugin,
  FixEmptyQuoteAfterDeletePlugin,
  FixTextFormatPlugin,
  FloatingTextFormatToolbarPlugin,
  IsEmptyPlugin,
  IsFocusedPlugin,
  LinkPlugin,
  OrderedListRecomputePlugin,
  ShortcutsPlugin,
  type AutoLinePluginProps,
  type IsEmptyPluginProps,
  type IsFocusedPluginProps,
} from './plugins';
import {
  CODE_PLUS,
  ELEMENT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from './transformers';

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

type CompositionInputProps = {
  ref?: Ref<CompositionInputRef>;
  isFixedTools?: boolean;
  onEmptyChange?: IsEmptyPluginProps['onChange'];
  onFocusChange?: IsFocusedPluginProps['onFocusChange'];
  onLineChange?: AutoLinePluginProps['onLineChange'];
};

type CompositionInputRef = {
  onPickEmoji: EmojiPickerProps['onPickEmoji'];
};

function CompositionInput({
  ref,
  isFixedTools = false,
  onEmptyChange,
  onFocusChange,
  onLineChange,
}: CompositionInputProps) {
  const [_isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

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

  const onChange = (_editorState: EditorState, editor: LexicalEditor) => {
    editor.read(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      console.log('HTML:', htmlString);
    });
  };

  return (
    <div
      id='synclan-composition-scroll-wrapper'
      className='relative max-h-56 overflow-y-auto px-3'
    >
      <ShortcutsPlugin />
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className={cn(
              'w-full max-w-none text-sm leading-5.5 text-foreground outline-none focus:outline-none',
            )}
            aria-placeholder='Enter Message'
            placeholder={
              <p className='text-muted-foreground pointer-events-none absolute top-0 inline-block text-sm select-none'>
                Send Message
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
      {!isFixedTools ? (
        <FloatingTextFormatToolbarPlugin
          onSetIsLinkEditMode={setIsLinkEditMode}
        />
      ) : null}
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
  );
}

export {
  CompositionInput,
  type CompositionInputProps,
  type CompositionInputRef,
};
