import { $isLinkNode } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $copyNode,
  $createParagraphNode,
  $findMatchingParent,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ENTER_COMMAND,
} from 'lexical';
import { useEffect } from 'react';
import { useLatest } from 'react-use';

import {
  $createSimpleListItemNode,
  $isSimpleListItemNode,
  $isSimpleListNode,
  $isSimpleQuoteNode,
  type SimpleListNode,
} from '../nodes';
import {
  $copyCompleteNodeWithChildren,
  $findNearestCodeNode,
  $findNearestListNode,
  $getSelectedTopLevelElements,
  $selectionJustContainsSameCodeNode,
  $splitLinkNodeBySelection,
  $splitNodesFromOneLine,
} from './lib';

type EnterPluginProps = {
  onSend?: () => void;
};

function EnterBehaviorPlugin({ onSend }: EnterPluginProps) {
  const [editor] = useLexicalComposerContext();

  const onChangeRef = useLatest(onSend);

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
            event.preventDefault();

            const anchorNode = selection.anchor.getNode(),
              focusNode = selection.focus.getNode();

            const isCollapsed = selection.isCollapsed();

            if (isCollapsed) {
              if ($findNearestCodeNode(anchorNode))
                return editor.dispatchCommand(
                  INSERT_PARAGRAPH_COMMAND,
                  undefined,
                );

              const topNode = anchorNode.getTopLevelElementOrThrow();
              if (
                $isSimpleQuoteNode(topNode) ||
                $findNearestListNode(topNode)
              ) {
                const parent = $findMatchingParent(anchorNode, (node) => {
                  return (
                    $isParagraphNode(node) ||
                    $isSimpleListItemNode(node) ||
                    $isSimpleListNode(node) ||
                    $isSimpleQuoteNode(node)
                  );
                });

                if (parent === null)
                  return editor.dispatchCommand(
                    INSERT_PARAGRAPH_COMMAND,
                    undefined,
                  );

                if (parent.getChildrenSize() <= 0) {
                  if ($isSimpleListItemNode(parent)) {
                    const listNode = parent.getParent<SimpleListNode>();
                    if (listNode?.is(topNode)) {
                      const paragraph = $createParagraphNode();
                      topNode.replace(paragraph);
                      paragraph
                        .setTextStyle(selection.style)
                        .setTextFormat(selection.format)
                        .select();
                      return true;
                    }
                    const warpper = listNode?.getParent();
                    if ($isSimpleListItemNode(warpper)) {
                      // force to update dom
                      const listItem = $createSimpleListItemNode();
                      warpper.replace(listItem);
                      listItem.selectEnd();
                      return true;
                    }
                    listNode?.remove();
                  } else {
                    const paragraph = $createParagraphNode();
                    topNode.replace(paragraph);
                    paragraph
                      .setTextStyle(selection.style)
                      .setTextFormat(selection.format)
                      .select();
                  }
                  return true;
                }

                let leftNodes = [],
                  rightNodes = [];

                let matched = false;
                for (const child of parent.getChildren()) {
                  if (child.is(anchorNode) || child.isParentOf(anchorNode)) {
                    matched = true;

                    if ($isTextNode(child)) {
                      const textContent = child.getTextContent();
                      const leftText = textContent.slice(
                          0,
                          selection.anchor.offset,
                        ),
                        rightText = textContent.slice(selection.anchor.offset);

                      if (leftText) {
                        const textNode = $copyNode(child);
                        textNode.setTextContent(leftText);
                        leftNodes.push(textNode);
                      }

                      if (rightText) {
                        const textNode = $copyNode(child);
                        textNode.setTextContent(rightText);
                        rightNodes.push(textNode);
                      }
                    }

                    if ($isLinkNode(child) && $isTextNode(anchorNode)) {
                      const { leftNodes: left, rightNodes: right } =
                        $splitLinkNodeBySelection(
                          child,
                          anchorNode,
                          selection.anchor.offset,
                        );

                      if (left.length > 0) {
                        const linkNode = $copyNode(child);
                        linkNode.clear();
                        linkNode.append(...left);
                        leftNodes.push(linkNode);
                      }

                      if (right.length > 0) {
                        const linkNode = $copyNode(child);
                        linkNode.clear();
                        linkNode.append(...right);
                        rightNodes.push(linkNode);
                      }
                    }

                    continue;
                  }

                  if (!matched) {
                    leftNodes.push(child);
                    continue;
                  }

                  if (matched) {
                    rightNodes.push(child);
                    continue;
                  }
                }

                parent.clear();
                parent.append(...leftNodes);

                const copyedNode = $copyCompleteNodeWithChildren(
                  parent,
                  rightNodes,
                )!;
                topNode.insertAfter(copyedNode);
                copyedNode.selectStart();

                return true;
              }
            } else {
              if ($selectionJustContainsSameCodeNode(selection))
                return editor.dispatchCommand(
                  INSERT_PARAGRAPH_COMMAND,
                  undefined,
                );

              const isBackward = selection.isBackward();

              const startNode = isBackward ? focusNode : anchorNode,
                endNode = isBackward ? anchorNode : focusNode,
                startOffset = isBackward
                  ? selection.focus.offset
                  : selection.anchor.offset,
                endOffset = isBackward
                  ? selection.anchor.offset
                  : selection.focus.offset;

              const startParent = $findMatchingParent(startNode, (node) => {
                  return (
                    $isParagraphNode(node) ||
                    $isSimpleListItemNode(node) ||
                    $isSimpleListNode(node) ||
                    $isSimpleQuoteNode(node)
                  );
                }),
                endParent = $findMatchingParent(endNode, (node) => {
                  return (
                    $isParagraphNode(node) ||
                    $isSimpleListItemNode(node) ||
                    $isSimpleListNode(node) ||
                    $isSimpleQuoteNode(node)
                  );
                });

              if (startParent === null || endParent === null)
                return editor.dispatchCommand(
                  INSERT_PARAGRAPH_COMMAND,
                  undefined,
                );

              const topNode = anchorNode.getTopLevelElementOrThrow();

              if (startParent.is(endParent)) {
                // same line
                const { leftNodes: startLeftNodes } = $splitNodesFromOneLine(
                    startParent.getChildren(),
                    startNode,
                    startOffset,
                  ),
                  { rightNodes: endRightNodes } = $splitNodesFromOneLine(
                    endParent.getChildren(),
                    endNode,
                    endOffset,
                  );

                startParent.clear();
                startParent.append(...startLeftNodes);

                const node = $copyCompleteNodeWithChildren(
                  startParent,
                  endRightNodes,
                );
                if (node) {
                  topNode.insertAfter(node);
                  node.selectStart();
                }
              } else {
                const { leftNodes: startLeftNodes } = $splitNodesFromOneLine(
                    startParent.getChildren(),
                    startNode,
                    startOffset,
                  ),
                  { rightNodes: endRightNodes } = $splitNodesFromOneLine(
                    endParent.getChildren(),
                    endNode,
                    endOffset,
                  );

                // first line
                startParent.clear();
                startParent.append(...startLeftNodes);

                // middle lines
                const selectedNodes = $getSelectedTopLevelElements(selection);
                if (selectedNodes.length > 2) {
                  const middle = selectedNodes.slice(1, -1);
                  for (const node of middle) {
                    node.remove();
                  }
                }

                // last line
                endParent.clear();
                endParent.append(...endRightNodes);

                endParent.getTopLevelElement()?.selectStart();
              }

              return true;
            }

            return editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
          }
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, onChangeRef]);

  return null;
}

export { EnterBehaviorPlugin };
