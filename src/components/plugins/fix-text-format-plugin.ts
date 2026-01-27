import { useEffect, type JSX } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_NORMAL,
  KEY_BACKSPACE_COMMAND,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

function FixTextFormatPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const prev = anchorNode.getPreviousSibling();
        if (
          selection.anchor.offset === 0 &&
          anchorNode.getTextContent()[selection.anchor.offset] === ' ' &&
          $isTextNode(prev) &&
          (prev.hasFormat('bold') ||
            prev.hasFormat('italic') ||
            prev.hasFormat('strikethrough') ||
            prev.hasFormat('underline'))
        ) {
          selection.setFormat(prev.getFormat());
        }

        return false;
      },
      COMMAND_PRIORITY_NORMAL,
    );
  }, [editor]);

  return null;
}

export { FixTextFormatPlugin };
