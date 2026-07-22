import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import {
  createEmptyHistoryState,
  HistoryPlugin,
  type HistoryState,
} from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $nodesOfType,
  type LexicalEditor,
} from 'lexical';
import { useImperativeHandle, useRef, useState, type Ref } from 'react';

import { type EmojiPickerProps } from '@/components/emoji';
import { $createEmojiNode, ImageNode } from '@/components/nodes';
import {
  AutoLinePlugin,
  CodeBehaviorPlugin,
  CodeNodeToolbarPlugin,
  EmojiPickerPlugin,
  EmptyBlockToParagraphPlugin,
  EnterBehaviorPlugin,
  FixEmptyQuoteAfterDeletePlugin,
  FixTextFormatPlugin,
  FloatingTextFormatToolbarPlugin,
  ImagePlugin,
  IsEmptyPlugin,
  IsFocusedPlugin,
  LinkPlugin,
  OrderedListRecomputePlugin,
  ShortcutsPlugin,
  type AutoLinePluginProps,
  type IsEmptyPluginProps,
  type IsFocusedPluginProps,
} from '@/components/plugins';
import {
  CODE_PLUS,
  ELEMENT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from '@/components/transformers';
import { useIsMobile } from '@/hooks';
import { cn } from '@/lib/utils';

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

type SendData = {
  content: string;
  plainContent?: string;
  attachments: Attachment[];
};

type CompositionInputProps = {
  ref?: Ref<CompositionInputRef>;
  isFixedTools?: boolean;
  onEmptyChange?: IsEmptyPluginProps['onChange'];
  onFocusChange?: IsFocusedPluginProps['onFocusChange'];
  onLineChange?: AutoLinePluginProps['onLineChange'];
  onSend?: (data: SendData) => Promise<void>;
};

type CompositionInputRef = {
  getEditor(): LexicalEditor | null;
  onPickEmoji: EmojiPickerProps['onPickEmoji'];
};

function CompositionInput({
  ref,
  isFixedTools = false,
  onEmptyChange,
  onFocusChange,
  onLineChange,
  onSend,
}: CompositionInputProps) {
  const [_isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const editorRef = useRef<LexicalEditor>(null);
  const historyState = useRef<HistoryState>(createEmptyHistoryState());

  const isMobile = useIsMobile();

  useImperativeHandle(ref, () => ({
    getEditor: onGetEditor,
    onPickEmoji: onPickEmojiHandle,
  }));

  const onGetEditor = () => editorRef.current;

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

  // const onChange = (_editorState: EditorState, editor: LexicalEditor) => {
  //   editor.read(() => {
  //     const htmlString = $generateHtmlFromNodes(editor);
  //     console.log('HTML:', htmlString);
  //   });
  // };

  return (
    <div
      id='synclan-composition-scroll-wrapper'
      className='relative max-h-56 overflow-y-auto px-3'
    >
      <ContentEditable
        id='synclan-editor'
        className={cn(
          'w-full max-w-none text-sm leading-5.5 text-foreground outline-none focus:outline-none',
        )}
        aria-placeholder='Enter Message'
        enterKeyHint='send'
        placeholder={
          <p className='text-muted-foreground pointer-events-none absolute top-0 inline-block text-sm select-none'>
            Send Message
          </p>
        }
      />
      <ShortcutsPlugin />
      <EditorRefPlugin editorRef={editorRef} />
      <HistoryPlugin externalHistoryState={historyState.current} />
      {/*<AutoFocusPlugin />*/}
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
      {/*<CodeHighlightShikiPlugin />*/}
      <CodeNodeToolbarPlugin />
      <CodeBehaviorPlugin />
      <FixTextFormatPlugin />
      <OrderedListRecomputePlugin />
      <EmptyBlockToParagraphPlugin />
      {!isMobile && !isFixedTools ? (
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
      {/*<OnChangePlugin onChange={onChange} />*/}
      <ImagePlugin />
      <EnterBehaviorPlugin
        onSend={(editorState) => {
          if (editorState.isEmpty()) return;

          const attachments: Attachment[] = [];
          let plainContent: string | undefined;
          editorState.read(() => {
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
          });
          const content = JSON.stringify(editorState.toJSON());
          void onSend?.({ content, plainContent, attachments });
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
