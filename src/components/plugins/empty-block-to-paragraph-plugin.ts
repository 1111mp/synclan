import { useEffect } from 'react';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { $isSimpleQuoteNode, SimpleListItemNode } from '../nodes';
import { $findNearestListNode } from './lib';

function EmptyBlockToParagraphPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    function commandHandler(event: KeyboardEvent) {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed())
        return false;

      const anchorNode = selection.anchor.getNode();
      if (
        selection.anchor.offset !== 0 ||
        anchorNode.getPreviousSibling() !== null
      )
        return false;

      const topNode = anchorNode.getTopLevelElement(),
        nearestListNode = $findNearestListNode(anchorNode);

      // top level node is `QuoteNode` & first child is `ListNode`
      if (
        nearestListNode &&
        $isSimpleQuoteNode(topNode) &&
        topNode.is(nearestListNode?.getParent())
      ) {
        event.preventDefault();

        if (nearestListNode.getTextContentSize() === 0) {
          nearestListNode.remove();
          topNode.selectStart();
        } else {
          topNode.append(
            ...(nearestListNode
              .getFirstChild<SimpleListItemNode>()
              ?.getChildren() ?? []),
          );
          nearestListNode.remove();
          topNode.selectStart();
        }

        return true;
      }

      // `ListNode`
      if (nearestListNode && topNode?.is(nearestListNode)) {
        event.preventDefault();

        const paragraph = $createParagraphNode();
        if (nearestListNode?.getTextContentSize() > 0) {
          paragraph.append(
            ...(nearestListNode
              .getFirstChild<SimpleListItemNode>()
              ?.getChildren() ?? []),
          );
        }
        topNode.replace(paragraph);
        paragraph.selectStart();

        return true;
      }

      // `QuoteNode`
      if ($isSimpleQuoteNode(topNode) && nearestListNode === null) {
        event.preventDefault();

        const paragraph = $createParagraphNode();
        if (topNode.getChildrenSize() > 0) {
          paragraph.append(...topNode.getChildren());
        }

        topNode.replace(paragraph);
        paragraph.selectStart();

        return true;
      }

      return false;
    }

    return mergeRegister(
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        commandHandler,
        COMMAND_PRIORITY_HIGH,
      ),

      editor.registerCommand(
        KEY_DELETE_COMMAND,
        commandHandler,
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  return null;
}

export { EmptyBlockToParagraphPlugin };
