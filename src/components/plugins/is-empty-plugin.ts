import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalIsTextContentEmpty } from '@lexical/react/useLexicalIsTextContentEmpty';

type IsEmptyPluginProps = {
  onChange?: (empty: boolean) => void;
};

function IsEmptyPlugin({ onChange }: IsEmptyPluginProps) {
  const [editor] = useLexicalComposerContext();
  const isEmpty = useLexicalIsTextContentEmpty(editor);

  const onChangeRef = useRef<IsEmptyPluginProps['onChange']>(null);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current?.(isEmpty);
  }, [isEmpty]);

  return null;
}

export { IsEmptyPlugin, type IsEmptyPluginProps };
