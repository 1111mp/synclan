import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  type EditorState,
  type LexicalEditor,
} from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
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
import { $createEmojiNode } from './nodes';
import { cn } from '@/lib/utils';
import { type EmojiPickerProps } from './emoji';

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

  const onChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      console.log('HTML:', htmlString);
    });
  };

  return (
    <div
      id='synclan-composition-scroll-wrapper'
      className='relative px-3 max-h-56 overflow-y-auto scrollbar-color dark:scrollbar-color'
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
              <p className='inline-block absolute top-0 text-sm text-muted-foreground select-none pointer-events-none'>
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
