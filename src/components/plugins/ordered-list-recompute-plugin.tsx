import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { SimpleListItemNode, SimpleListNode } from '../nodes';
import { $recomputeOrderedListNumbers } from './lib';
import { mergeRegister } from '@lexical/utils';

export function OrderedListRecomputePlugin() {
  const [editor] = useLexicalComposerContext();

  const isRecomputing = useRef<boolean>(false);

  useEffect(() => {
    return mergeRegister(
      editor.registerNodeTransform(SimpleListNode, (node) => {
        if (isRecomputing.current) return;

        if (node.getListType() === 'number') {
          isRecomputing.current = true;
          $recomputeOrderedListNumbers();
          isRecomputing.current = false;
        }
      }),
      editor.registerNodeTransform(SimpleListItemNode, (node) => {
        if (isRecomputing.current) return;

        if (node.getParent<SimpleListNode>()?.getListType() === 'number') {
          isRecomputing.current = true;
          $recomputeOrderedListNumbers();
          isRecomputing.current = false;
        }
      }),
    );
  }, [editor]);

  return null;
}
