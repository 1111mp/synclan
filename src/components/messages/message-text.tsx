import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { defineExtension, type EditorState, type LexicalEditor } from 'lexical';
import { useMemo } from 'react';

import { EDITOR_INITIAL_CONFIG } from '@/components/transmitter';

import { parseTextMessageContent } from './util';

type Props = {
  message: TextMessage;
};

function TextMessage({ message }: Props) {
  const { content } = message;
  if (!content) {
    return <p className='wrap-break-word select-text'>{content}</p>;
  }

  const initialState = parseTextMessageContent(content);
  if (typeof initialState === 'string') {
    return <p className='wrap-break-word select-text'>{content}</p>;
  }

  return <LexicalMessage initialState={initialState} />;
}

function LexicalMessage({
  initialState,
}: {
  initialState: EditorState | ((editor: LexicalEditor) => void);
}) {
  const extension = useMemo(
    () =>
      defineExtension({
        ...EDITOR_INITIAL_CONFIG,
        $initialEditorState: initialState,
        name: 'synclan-editor-extension',
        editable: false,
      }),
    [initialState],
  );

  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <ContentEditable className='wrap-break-word outline-none select-text' />
    </LexicalExtensionComposer>
  );
}

export { TextMessage };
