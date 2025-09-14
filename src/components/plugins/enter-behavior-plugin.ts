import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  ElementNode,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ENTER_COMMAND,
  TextNode,
  type LexicalNode,
  type RangeSelection,
} from 'lexical';
import { $createQuoteNode, $isQuoteNode, QuoteNode } from '@lexical/rich-text';
import {
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
} from '@lexical/list';
import { $createNestedListWithDepth, $findNearestListItemNode } from './lib';

type EnterPluginProps = {
  onSend?: () => void;
};

function EnterBehaviorPlugin({ onSend }: EnterPluginProps) {
  const [editor] = useLexicalComposerContext();

  const onChangeRef = useRef<EnterPluginProps['onSend']>(null);
  onChangeRef.current = onSend;

  useEffect(() => {
    return editor.registerCommand<KeyboardEvent | null>(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        if (editor.__emojiMenuOpen) return false;

        if (event !== null) {
          // Enter
          if (!event.shiftKey) {
            event.preventDefault();

            onChangeRef.current?.();
            return true;
          }

          // Shift + Enter
          if (event.shiftKey) {
            const anchorNode = selection.anchor.getNode();

            // For QuoteNode
            const topNode = anchorNode.getTopLevelElementOrThrow();
            if ($isQuoteNode(topNode)) {
              event.preventDefault();

              $quoteNodeShiftEnterBehavior(
                topNode,
                anchorNode,
                selection,
                selection.anchor.offset,
              );

              return true;
            }

            // For ListNode
            if ($isListNode(topNode)) {
              const nearestListItemNode = $findNearestListItemNode(anchorNode);
              if (!$isListItemNode(nearestListItemNode)) return false;

              const nearestListNode = nearestListItemNode.getParent<ListNode>();
              if (!$isListNode(nearestListNode)) return false;

              event.preventDefault();

              if (nearestListItemNode.getChildrenSize() === 0) {
                return editor.dispatchCommand(
                  INSERT_PARAGRAPH_COMMAND,
                  undefined,
                );
              } else {
                $listNodeShiftEnterBehavior(
                  topNode,
                  nearestListNode,
                  nearestListItemNode,
                  anchorNode,
                  selection.anchor.offset,
                );
              }

              return true;
            }

            event.preventDefault();
            return editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
          }
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}

function $quoteNodeShiftEnterBehavior(
  quoteNode: QuoteNode,
  anchorNode: TextNode | ElementNode,
  selection: RangeSelection,
  offset: number,
) {
  if (quoteNode.getChildrenSize() === 0) {
    // If the content is empty we should exit the quote mode
    const paragraph = $createParagraphNode();
    quoteNode.replace(paragraph);
    paragraph
      .setTextStyle(selection.style)
      .setTextFormat(selection.format)
      .select();
  } else {
    const children = quoteNode.getChildren();
    const index = children.findIndex((c) => c.getKey() === anchorNode.getKey());

    let preHalf: LexicalNode[] = [],
      nextHalf: LexicalNode[] = [];

    if (index < 0) {
      preHalf = children.slice(0, offset);
      nextHalf = children.slice(offset);
    } else {
      children.forEach((child, i) => {
        if (i < index) {
          preHalf.push(child);
        } else if (i > index) {
          nextHalf.push(child);
        } else {
          if ($isTextNode(child)) {
            if (offset === 0) {
              nextHalf.push(child);
            } else {
              const [before, after] = child.splitText(offset);
              if (before) preHalf.push(before);
              if (after) nextHalf.push(after);
            }
          } else {
            if (offset === 0) {
              nextHalf.push(child);
            } else {
              preHalf.push(child);
            }
          }
        }
      });
    }

    if (preHalf.length > 0) {
      const newQuoteNode = $createQuoteNode();
      newQuoteNode.append(...preHalf);
      quoteNode.insertBefore(newQuoteNode);
    } else {
      const newQuoteNode = $createQuoteNode();
      quoteNode.insertBefore(newQuoteNode);
    }

    if (nextHalf.length > 0) {
      const newQuoteNode = $createQuoteNode();
      newQuoteNode.append(...nextHalf);
      quoteNode.insertBefore(newQuoteNode);

      newQuoteNode.select(0, 0);
    } else {
      const newQuoteNode = $createQuoteNode();
      quoteNode.insertBefore(newQuoteNode);
      newQuoteNode.select();
    }

    quoteNode.remove();
  }
}

function $listNodeShiftEnterBehavior(
  topListNode: ListNode,
  nearestListNode: ListNode,
  nearestListItemNode: ListItemNode,
  anchorNode: TextNode | ElementNode,
  offset: number,
) {
  const children = nearestListItemNode.getChildren();
  const index = children.findIndex((c) => c.getKey() === anchorNode.getKey());

  let preHalf: LexicalNode[] = [],
    nextHalf: LexicalNode[] = [];
  if (index < 0) {
    preHalf = children.slice(0, offset);
    nextHalf = children.slice(offset);
  } else {
    children.forEach((child, i) => {
      if (i < index) {
        preHalf.push(child);
      } else if (i > index) {
        nextHalf.push(child);
      } else {
        if ($isTextNode(child)) {
          if (offset === 0) {
            nextHalf.push(child);
          } else {
            const [before, after] = child.splitText(offset);
            if (before) preHalf.push(before);
            if (after) nextHalf.push(after);
          }
        } else {
          if (offset === 0) {
            nextHalf.push(child);
          } else {
            preHalf.push(child);
          }
        }
      }
    });
  }

  const listType = nearestListNode.getListType(),
    indent = nearestListItemNode.getIndent();

  if (preHalf.length > 0) {
    const { outerListNode: newListNode, innerListItemNode } =
      $createNestedListWithDepth(listType, indent);

    innerListItemNode.append(...preHalf);
    topListNode.insertBefore(newListNode);
  } else {
    const { outerListNode: newListNode } = $createNestedListWithDepth(
      listType,
      indent,
    );

    topListNode.insertBefore(newListNode);
  }

  if (nextHalf.length > 0) {
    const {
      outerListNode: newListNode,
      innerListNode,
      innerListItemNode,
    } = $createNestedListWithDepth(listType, indent);

    innerListItemNode.append(...nextHalf);
    topListNode.insertBefore(newListNode);
    innerListNode.select(0, 0);
  } else {
    const { outerListNode: newListNode, innerListNode } =
      $createNestedListWithDepth(listType, indent);

    topListNode.insertBefore(newListNode);
    innerListNode.select();
  }

  topListNode.remove();
}

export { EnterBehaviorPlugin };
