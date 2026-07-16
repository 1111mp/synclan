import { $generateHtmlFromNodes } from '@lexical/html';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import {
  $getRoot,
  defineExtension,
  type EditorState,
  type LexicalEditor,
} from 'lexical';
import { useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { toast } from 'sonner';

import { SynclanEditorExtension } from '@/components/extensions';

import { parseTextMessageContent } from './util';

type MessageContextMenuRef = {
  onCopy: () => Promise<void>;
};

type Props = {
  ref?: Ref<MessageContextMenuRef>;
  message: TextMessage;
};

function TextMessage({ ref, message }: Props) {
  const { content } = message;

  const lexicalMessageRef = useRef<MessageContextMenuRef>(null);

  useImperativeHandle(ref, () => ({
    onCopy: onCopyHandler,
  }));

  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const initialState = useMemo(() => parseTextMessageContent(content), []);

  const onCopyHandler = async () => {
    if (typeof initialState === 'string') {
      await navigator.clipboard.writeText(initialState);
      toast.success('Copied to clipboard');
      return;
    }

    if (lexicalMessageRef.current) {
      await lexicalMessageRef.current.onCopy();
    }
  };

  if (typeof initialState === 'string') {
    return <p className='wrap-break-word select-text'>{content}</p>;
  }

  return <LexicalMessage ref={lexicalMessageRef} initialState={initialState} />;
}

function LexicalMessage({
  ref,
  initialState,
}: {
  ref?: Ref<MessageContextMenuRef>;
  initialState: EditorState | ((editor: LexicalEditor) => void);
}) {
  const editorRef = useRef<LexicalEditor>(null);

  useImperativeHandle(ref, () => ({
    onCopy: onCopyHandler,
  }));

  const extension = useMemo(
    () =>
      defineExtension({
        dependencies: [SynclanEditorExtension],
        $initialEditorState: initialState,
        name: 'synclan-editor/message-extension',
        editable: false,
        theme: {
          code: 'block relative pt-4 pb-4 pl-[72px] pr-2 my-0 border rounded-md indent-0 before:box-border before:absolute before:top-0 before:left-0 before:content-[attr(data-gutter)] before:w-14 before:pt-4 before:px-2 before:pb-0 before:font-thin before:text-right',
        },
      }),
    [initialState],
  );

  const onCopyHandler = async () => {
    const editor = editorRef.current;
    if (editor) {
      const { html, plain } = editor.getEditorState().read(() => {
        return {
          html: $generateHtmlFromNodes(editor),
          plain: $getRoot().getTextContent(),
        };
      });

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ]);
      toast.success('Copied to clipboard');
    }
  };

  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <ContentEditable className='wrap-break-word outline-none select-text' />
      <EditorRefPlugin editorRef={editorRef} />
    </LexicalExtensionComposer>
  );
}

export { TextMessage, type MessageContextMenuRef };
