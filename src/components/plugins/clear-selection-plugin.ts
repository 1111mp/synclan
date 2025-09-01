import { useEffect } from 'react';
import {
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';

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

    return mergeRegister(
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        removeCommand,
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        removeCommand,
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  return null;
}

export { ClearSelectionPlugin };
