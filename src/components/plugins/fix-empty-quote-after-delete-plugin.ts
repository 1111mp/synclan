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
import { $isSimpleQuoteNode } from '../nodes';

function FixEmptyQuoteAfterDeletePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeCommand = () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || selection.isCollapsed())
        return false;

      const endNode = selection.isBackward()
          ? selection.anchor.getNode()
          : selection.focus.getNode(),
        topNode = endNode.getTopLevelElement();

      if (!$isSimpleQuoteNode(topNode)) return false;

      editor.update(() => {
        if (topNode?.getChildrenSize() === 0) {
          topNode.remove();
        }
      });

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

export { FixEmptyQuoteAfterDeletePlugin };
