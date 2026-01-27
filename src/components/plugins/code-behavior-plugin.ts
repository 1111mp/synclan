import { useEffect, type JSX } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  SELECT_ALL_COMMAND,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isCodePlusNode } from '../nodes';
import { mergeRegister } from '@lexical/utils';
import { $findNearestCodeNode } from './lib';

function CodeBehaviorPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECT_ALL_COMMAND,
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          const anchorNode = selection.anchor.getNode();
          const codeNode = $findNearestCodeNode(anchorNode);

          if (codeNode) {
            const codeSelection = codeNode.select(
              0,
              codeNode.getChildrenSize(),
            );
            $setSelection(codeSelection);

            return true;
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

export { CodeBehaviorPlugin };

function deleteHandle(event: KeyboardEvent) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return false;

  const anchorNode = selection.anchor.getNode();

  if (selection.isCollapsed()) {
    const node = $findNearestCodeNode(anchorNode);
    if (node && node.getChildrenSize() === 0 && !node.getPendingDelete()) {
      event.preventDefault();
      return true;
    }
  }

  const codeNode = anchorNode.getPreviousSibling();
  if ($isCodePlusNode(codeNode)) {
    codeNode.setPendingDelete(true);
    return false;
  }

  return false;
}
