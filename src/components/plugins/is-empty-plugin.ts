import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalIsTextContentEmpty } from '@lexical/react/useLexicalIsTextContentEmpty';
import { useLatestRef } from '@/hooks';

type IsEmptyPluginProps = {
  onChange?: (empty: boolean) => void;
};

function IsEmptyPlugin({ onChange }: IsEmptyPluginProps) {
  const [editor] = useLexicalComposerContext();
  const isEmpty = useLexicalIsTextContentEmpty(editor);

  const onChangeRef = useLatestRef(onChange);

  useEffect(() => {
    onChangeRef.current?.(isEmpty);
  }, [isEmpty, onChangeRef]);

  return null;
}

export { IsEmptyPlugin, type IsEmptyPluginProps };
