import { useEffect, type JSX } from 'react';
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  SELECT_ALL_COMMAND,
  type RootNode,
  type RangeSelection,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isCodePlusNode } from '../nodes';
import { mergeRegister } from '@lexical/utils';

function CodeBehaviorPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const deleteHandle = (event: KeyboardEvent) => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const codeNode = anchorNode.getPreviousSibling();
        if ($isCodePlusNode(codeNode)) {
          codeNode.setPendingDelete(true);
          return false;
        }

        const root = $getRoot();
        if (root.getChildrenSize() <= 1) return false;

        if (
          $isCodePlusNode(anchorNode.getTopLevelElementOrThrow()) &&
          selection.anchor.offset === 0
        ) {
          event.preventDefault();
          return true;
        }

        /// selected all
        if (isSelectedAll(root, selection)) {
          editor.update(() => {});
          const children = root.getChildren();
          for (const c of children) c.remove();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
          paragraph.select(0, 0);

          return true;
        }
      }

      return false;
    };

    return mergeRegister(
      editor.registerCommand(
        SELECT_ALL_COMMAND,
        () => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const codeNode = anchorNode.getTopLevelElementOrThrow();

            if ($isCodePlusNode(codeNode)) {
              const codeSelection = codeNode.select(
                0,
                codeNode.getChildrenSize(),
              );
              $setSelection(codeSelection);

              return true;
            }
          }

          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        deleteHandle,
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        deleteHandle,
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  return null;
}

function isSelectedAll(root: RootNode, selection: RangeSelection) {
  if (!$isRangeSelection(selection) || selection.isCollapsed()) return false;

  const selected = new Set();
  const nodes = selection.getNodes();
  for (const n of nodes) {
    const top = n.getTopLevelElement();
    if (top) {
      selected.add(top.getKey());
    }
  }

  return root.getChildrenSize() === selected.size;
}

export { CodeBehaviorPlugin };
