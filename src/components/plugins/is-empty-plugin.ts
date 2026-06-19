import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalIsTextContentEmpty } from '@lexical/react/useLexicalIsTextContentEmpty';
import { useEffect } from 'react';
import { useLatest } from 'react-use';

type IsEmptyPluginProps = {
  onChange?: (empty: boolean) => void;
};

function IsEmptyPlugin({ onChange }: IsEmptyPluginProps) {
  const [editor] = useLexicalComposerContext();
  const isEmpty = useLexicalIsTextContentEmpty(editor);

  const onChangeRef = useLatest(onChange);

  useEffect(() => {
    onChangeRef.current?.(isEmpty);
  }, [isEmpty, onChangeRef]);

  return null;
}

export { IsEmptyPlugin, type IsEmptyPluginProps };
