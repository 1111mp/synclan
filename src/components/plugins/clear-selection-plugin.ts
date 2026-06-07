import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  $getSelection,
  $isRangeSelection,
} from 'lexical';

function ClearSelectionPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeCommand = () => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        const hasListNode = nodes.some(
          (n) => n.getType && n.getType() === 'list',
        );
        if (hasListNode) {
          nodes.forEach((node) => node.remove());
          return true;
        }
      }

      return false;
    };

    const deleteListener = editor.registerCommand(
      KEY_DELETE_COMMAND,
      removeCommand,
      COMMAND_PRIORITY_HIGH,
    );

    const backspaceListener = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      removeCommand,
      COMMAND_PRIORITY_HIGH,
    );

    return () => {
      deleteListener();
      backspaceListener();
    };
  }, []);

  return null;
}

export { ClearSelectionPlugin };
