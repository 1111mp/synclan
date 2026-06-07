import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ENTER_COMMAND,
  type LexicalNode,
} from 'lexical';
import { $createQuoteNode, $isQuoteNode } from '@lexical/rich-text';
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
} from '@lexical/list';

type EnterPluginProps = {
  onSend?: () => void;
};

function EnterPlugin({ onSend }: EnterPluginProps) {
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

              const anchorOffset = selection.anchor.offset;
              if (topNode.getChildrenSize() === 0) {
                // If the content is empty we should exit the quote mode
                const paragraph = $createParagraphNode();
                topNode.replace(paragraph);
                paragraph.select();
              } else {
                const children = topNode.getChildren();
                const index = children.findIndex(
                  (c) => c.getKey() === anchorNode.getKey(),
                );
                if (index < 0) {
                  const preHalf = children.slice(0, anchorOffset),
                    nextHalf = children.slice(anchorOffset);

                  if (preHalf.length > 0) {
                    const quoteNode = $createQuoteNode();
                    quoteNode.append(...preHalf);
                    anchorNode.insertBefore(quoteNode);
                  } else {
                    const quoteNode = $createQuoteNode();
                    anchorNode.insertBefore(quoteNode);
                    quoteNode.select();
                  }

                  if (nextHalf.length > 0) {
                    const quoteNode = $createQuoteNode();
                    quoteNode.append(...nextHalf);
                    anchorNode.insertBefore(quoteNode);

                    if (preHalf.length > 0) {
                      quoteNode.select(0, 0);
                    }
                  } else {
                    const quoteNode = $createQuoteNode();
                    anchorNode.insertBefore(quoteNode);
                    quoteNode.select();
                  }

                  anchorNode.remove();
                } else {
                  const preHalf: LexicalNode[] = [],
                    nextHalf: LexicalNode[] = [];
                  children.forEach((child, i) => {
                    if (i < index) {
                      preHalf.push(child);
                    } else if (i > index) {
                      nextHalf.push(child);
                    } else {
                      if ($isTextNode(child)) {
                        if (anchorOffset === 0) {
                          nextHalf.push(child);
                        } else {
                          const [before, after] = child.splitText(anchorOffset);
                          if (before) preHalf.push(before);
                          if (after) nextHalf.push(after);
                        }
                      } else {
                        if (anchorOffset === 0) {
                          nextHalf.push(child);
                        } else {
                          preHalf.push(child);
                        }
                      }
                    }
                  });

                  if (preHalf.length > 0) {
                    const quoteNode = $createQuoteNode();
                    quoteNode.append(...preHalf);
                    topNode.insertBefore(quoteNode);
                  }

                  if (nextHalf.length > 0) {
                    const quoteNode = $createQuoteNode();
                    quoteNode.append(...nextHalf);
                    topNode.insertBefore(quoteNode);
                    quoteNode.select(0, 0);
                  } else {
                    const quoteNode = $createQuoteNode();
                    topNode.insertBefore(quoteNode);
                    quoteNode.select();
                  }

                  topNode.remove();
                }
              }

              return true;
            }

            // For ListNode
            if ($isListNode(topNode)) {
              event.preventDefault();

              const anchorOffset = selection.anchor.offset;
              console.log('selection', selection);
              console.log('offset', anchorOffset);
              console.log('anchorNode', anchorNode);
              if (
                $isListItemNode(anchorNode) &&
                anchorNode.getChildrenSize() === 0
              ) {
                const paragraph = $createParagraphNode();
                topNode.insertBefore(paragraph);
                paragraph
                  .setTextStyle(selection.style)
                  .setTextFormat(selection.format)
                  .select();
                topNode.remove();
                return true;
              }
              if (
                (($isListItemNode(anchorNode) &&
                  anchorNode.getChildrenSize() > 0) ||
                  $isListItemNode(anchorNode.getParent())) &&
                selection.anchor.offset === 0
              ) {
                console.log(11111111);
                return true;
              }

              const preListItem = $isListItemNode(anchorNode)
                ? anchorNode
                : anchorNode.getParent();

              console.log(preListItem?.getChildren());

              const listNode = $createListNode(),
                listItem = $createListItemNode();

              listNode.setListType(topNode.getListType());
              const preIndent = preListItem?.getIndent() ?? 0;

              listNode.append(listItem);
              topNode.insertAfter(listNode);

              listItem.setIndent(preIndent);

              listItem.select();
              return true;
            }

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

export { EnterPlugin };

// import { useEffect, useRef } from 'react';
// import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
// import {
//   $createLineBreakNode,
//   $createParagraphNode,
//   $getRoot,
//   $getSelection,
//   $isLineBreakNode,
//   $isParagraphNode,
//   $isRangeSelection,
//   COMMAND_PRIORITY_HIGH,
//   INSERT_PARAGRAPH_COMMAND,
//   KEY_ENTER_COMMAND,
// } from 'lexical';
// import { $createQuoteNode, $isQuoteNode } from '@lexical/rich-text';
// import { $createListNode, $isListItemNode, $isListNode } from '@lexical/list';
// import { $getTopListNode, $removeHighestEmptyListParent } from './lib';
// import { $createQuoteParagraphNode } from '../nodes';

// type EnterPluginProps = {
//   onSend?: () => void;
// };

// function EnterPlugin({ onSend }: EnterPluginProps) {
//   const [editor] = useLexicalComposerContext();

//   const onChangeRef = useRef<EnterPluginProps['onSend']>(null);
//   onChangeRef.current = onSend;

//   useEffect(() => {
//     return editor.registerCommand<KeyboardEvent | null>(
//       KEY_ENTER_COMMAND,
//       (event) => {
//         const selection = $getSelection();
//         if (!$isRangeSelection(selection)) {
//           return false;
//         }

//         if (editor.__emojiMenuOpen) return false;

//         if (event !== null) {
//           // Enter
//           if (!event.shiftKey) {
//             event.preventDefault();

//             onChangeRef.current?.();
//             return true;
//           }

//           // Shift + Enter
//           if (event.shiftKey) {
//             const anchorNode = selection.anchor.getNode();

//             // For QuoteNode
//             console.log('anchorNode', anchorNode);
//             console.log(selection);
//             const quoteNode = $isQuoteNode(anchorNode)
//               ? anchorNode
//               : anchorNode.getParent();
//             if ($isQuoteNode(quoteNode)) {
//               console.log('children', quoteNode.getChildren());

//               if (
//                 $isParagraphNode(anchorNode) &&
//                 anchorNode.getChildrenSize() === 0
//               ) {
//                 event.preventDefault();

//                 const children = quoteNode.getChildren();
//                 const index = children.findIndex((c) => {
//                   return c.getKey() === anchorNode.getKey();
//                 });
//                 const leftHalf = children.slice(0, index);
//                 const rightHalf = children.slice(index + 1);

//                 const leftQuoteNode = $createQuoteNode(),
//                   rightQuoteNode = $createQuoteNode(),
//                   paragraph = $createParagraphNode();

//                 if (leftHalf.length > 0) {
//                   leftQuoteNode.append(...leftHalf);
//                   quoteNode.insertBefore(leftQuoteNode);
//                 }
//                 quoteNode.insertBefore(paragraph);
//                 if (rightHalf.length > 0) {
//                   rightQuoteNode.append(...rightHalf);
//                   quoteNode.insertBefore(rightQuoteNode);
//                 }

//                 paragraph
//                   .setTextStyle(selection.style)
//                   .setTextFormat(selection.format)
//                   .select();

//                 quoteNode.remove();

//                 return true;
//               }

//               if (
//                 $isQuoteNode(anchorNode) &&
//                 anchorNode.getChildrenSize() === 0
//               ) {
//                 console.log(22222);
//                 // If the content is empty we should exit the quote mode
//                 event.preventDefault();
//                 const paragraph = $createParagraphNode();
//                 quoteNode.replace(paragraph);
//                 paragraph.select();

//                 return true;
//               }

//               if ($isQuoteNode(anchorNode)) {
//                 const children = anchorNode.getChildren();
//                 const offset = selection.anchor.offset;
//                 console.log('offset', offset);

//                 if (children.every((c) => $isLineBreakNode(c))) {
//                   event.preventDefault();

//                   console.log(111111);
//                   const leftHalf = children.slice(0, offset - 1);
//                   const rightHalf = children.slice(offset + 1);
//                   console.log('leftHalf', leftHalf);
//                   console.log('rightHalf', rightHalf);

//                   if (leftHalf.length > 0) {
//                     const leftQuoteNode = $createQuoteNode();
//                     leftQuoteNode.append(...leftHalf);
//                     anchorNode.insertBefore(leftQuoteNode);
//                   }
//                   const paragraph = $createParagraphNode();
//                   anchorNode.insertBefore(paragraph);
//                   // if (rightHalf.length > 0) {
//                   const rightQuoteNode = $createQuoteNode();
//                   rightQuoteNode.append(...rightHalf);
//                   anchorNode.insertBefore(rightQuoteNode);
//                   // }

//                   anchorNode.remove();

//                   paragraph.select();

//                   return true;
//                 }

//                 if (
//                   $isLineBreakNode(
//                     children[offset === children.length ? offset - 1 : offset],
//                   )
//                 ) {
//                   event.preventDefault();
//                   const leftHalf =
//                     offset < 1 ? [] : children.slice(0, offset - 1);
//                   const rightHalf =
//                     offset >= children.length ? [] : children.slice(offset + 1);

//                   console.log('leftHalf', leftHalf);
//                   console.log('rightHalf', rightHalf);

//                   return true;

//                   const leftQuoteNode = $createQuoteNode(),
//                     rightQuoteNode = $createQuoteNode(),
//                     paragraph = $createParagraphNode();

//                   if (leftHalf.length > 0) {
//                     leftQuoteNode.append(...leftHalf);
//                     anchorNode.insertBefore(leftQuoteNode);
//                   }
//                   anchorNode.insertBefore(paragraph);
//                   if (rightHalf.length > 0) {
//                     rightQuoteNode.append(...rightHalf);
//                     anchorNode.insertBefore(rightQuoteNode);
//                   }

//                   anchorNode.remove();

//                   paragraph.select();

//                   return true;
//                 }
//               }

//               return false;
//             }

//             // For ListNode
//             const parent = anchorNode.getParent();
//             const listItemNode = $isListItemNode(anchorNode)
//               ? anchorNode
//               : parent;
//             if (
//               $isListItemNode(listItemNode) &&
//               listItemNode.getChildrenSize() === 0
//             ) {
//               event.preventDefault();
//               const topList = listItemNode.getParent();
//               if ($isListNode(topList) && $isQuoteNode(topList?.getParent())) {
//                 const paragraph = $createParagraphNode();
//                 topList.insertAfter(paragraph);
//                 paragraph
//                   .setTextStyle(selection.style)
//                   .setTextFormat(selection.format)
//                   .select();

//                 const nextSiblings = listItemNode.getNextSiblings();
//                 if (nextSiblings.length > 0) {
//                   const newList = $createListNode(topList.getListType());
//                   paragraph.insertAfter(newList);
//                   newList.append(...nextSiblings);
//                 }

//                 $removeHighestEmptyListParent(listItemNode);

//                 return true;
//               } else {
//                 return editor.dispatchCommand(
//                   INSERT_PARAGRAPH_COMMAND,
//                   undefined,
//                 );
//               }
//             }

//             event.preventDefault();
//             return editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
//           }
//         }

//         return false;
//       },
//       COMMAND_PRIORITY_HIGH,
//     );
//   }, [editor]);

//   return null;
// }

// export { EnterPlugin };
