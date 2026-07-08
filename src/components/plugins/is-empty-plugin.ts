import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isParagraphNode } from 'lexical';
import { useEffect } from 'react';
import { useLatest } from 'react-use';

type IsEmptyPluginProps = {
  onChange?: (empty: boolean) => void;
};

function IsEmptyPlugin({ onChange }: IsEmptyPluginProps) {
  const [editor] = useLexicalComposerContext();

  const onChangeRef = useLatest(onChange);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.read('latest', () => {
        onChangeRef.current?.($isEmpty());
      });
    });
  }, [editor, onChangeRef]);

  return null;
}

function $isEmpty(): boolean {
  const root = $getRoot();
  const children = root.getChildren();

  if (children.length > 1) {
    return false;
  } else {
    if ($isParagraphNode(children[0])) {
      const paragraphChildren = children[0].getChildren();
      return paragraphChildren.length === 0;
    } else {
      return false;
    }
  }
}

export { $isEmpty, IsEmptyPlugin, type IsEmptyPluginProps };
