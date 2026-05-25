import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type LexicalNode,
} from 'lexical';
import { useLatestRef } from '@/hooks';
import { mergeRegister } from '@lexical/utils';
import { $isCodePlusNode } from '../nodes';

type AutoLinePluginProps = {
  onLineChange?: (changed: boolean) => void;
};

function AutoLinePlugin({ onLineChange }: AutoLinePluginProps) {
  const [editor] = useLexicalComposerContext();

  const latestLineChange = useLatestRef(onLineChange);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          const root = $getRoot();
          if (root.getChildrenSize() > 1) {
            latestLineChange.current?.(true);
            return;
          }

          const node = root.getChildAtIndex(0);
          if ($nodeOrChildrenContainCodeNode(node)) {
            latestLineChange.current?.(true);
            return;
          }

          latestLineChange.current?.(false);
        });
      }),
    );
  }, [editor, latestLineChange]);

  return null;
}

export { AutoLinePlugin, type AutoLinePluginProps };

function $nodeOrChildrenContainCodeNode(node: LexicalNode | null): boolean {
  if (node === null) return false;

  if ($isCodePlusNode(node)) return true;

  if (!$isElementNode(node)) return false;

  const children = node.getChildren();
  for (const child of children) {
    if ($isCodePlusNode(child)) return true;

    if ($nodeOrChildrenContainCodeNode(child)) return true;
  }

  return false;
}
