import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { defineExtension, type EditorState, type LexicalEditor } from 'lexical';
import { useMemo } from 'react';

import { SynclanEditorExtension } from '@/components/transmitter';

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
        dependencies: [SynclanEditorExtension],
        $initialEditorState: initialState,
        name: 'synclan-editor/message-extension',
        editable: false,
        theme: {
          code: 'block relative pt-7 pb-4 pl-[72px] pr-2 my-0 border rounded-md indent-0 before:box-border before:absolute before:top-0 before:left-0 before:content-[attr(data-gutter)] before:w-14 before:pt-[29px] before:px-2 before:pb-0 before:font-thin before:text-right',
        },
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
