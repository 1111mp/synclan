/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {
  $copyNode,
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isLineBreakNode,
  $isParagraphNode,
  $isRangeSelection,
  $isRootNode,
  $isTextNode,
  $setSelection,
  DecoratorNode,
  INTERNAL_$isBlock,
  ParagraphNode,
  RootNode,
  type BaseSelection,
  type ElementNode,
  type LexicalNode,
  type NodeKey,
  type RangeSelection,
  type TextNode,
} from 'lexical';
import { $copyBlockFormatIndent, $isAtNodeEnd } from '@lexical/selection';
import { type ListType } from '@lexical/list';
import { $isLinkNode, type LinkNode } from '@lexical/link';
import {
  $createCodePlusNode,
  $createSimpleQuoteNode,
  $isSimpleQuoteNode,
  $createSimpleListItemNode,
  $createSimpleListNode,
  $isCodePlusNode,
  $isSimpleListNode,
  $isSimpleListItemNode,
  type CodePlusNode,
  type SimpleListNode,
  type SimpleListItemNode,
  SimpleQuoteNode,
} from '../nodes';
import { $findMatchingParent } from '@lexical/utils';
import invariant from './invariant';

declare global {
  interface Document {
    documentMode?: unknown;
  }

  interface Window {
    MSStream?: unknown;
  }
}

export const CAN_USE_DOM: boolean =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined';

const documentMode =
  CAN_USE_DOM && 'documentMode' in document ? document.documentMode : null;

export const IS_APPLE: boolean =
  CAN_USE_DOM && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export const IS_FIREFOX: boolean =
  CAN_USE_DOM && /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(navigator.userAgent);

export const CAN_USE_BEFORE_INPUT: boolean =
  CAN_USE_DOM && 'InputEvent' in window && !documentMode
    ? 'getTargetRanges' in new window.InputEvent('input')
    : false;

export const IS_SAFARI: boolean =
  CAN_USE_DOM && /Version\/[\d.]+.*Safari/.test(navigator.userAgent);

export const IS_IOS: boolean =
  CAN_USE_DOM &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !window.MSStream;

export const IS_ANDROID: boolean =
  CAN_USE_DOM && /Android/.test(navigator.userAgent);

// Keep these in case we need to use them in the future.
// export const IS_WINDOWS: boolean = CAN_USE_DOM && /Win/.test(navigator.platform);
export const IS_CHROME: boolean =
  CAN_USE_DOM && /^(?=.*Chrome).*/i.test(navigator.userAgent);
// export const canUseTextInputEvent: boolean = CAN_USE_DOM && 'TextEvent' in window && !documentMode;

export const IS_ANDROID_CHROME: boolean =
  CAN_USE_DOM && IS_ANDROID && IS_CHROME;

export const IS_APPLE_WEBKIT =
  CAN_USE_DOM && /AppleWebKit\/[\d.]+/.test(navigator.userAgent) && !IS_CHROME;

export function $getSelectedNode(
  selection: RangeSelection,
): TextNode | ElementNode {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? anchorNode : focusNode;
  }
}

export function $selectionContainsOnlyText(selection: RangeSelection): boolean {
  if (!$isRangeSelection(selection)) return false;

  const nodes = selection.getNodes();
  return nodes.every((n) => {
    if ($isTextNode(n)) return true;
    if ($isLineBreakNode(n)) return true;
    if ($isParagraphNode(n)) return true;

    return false;
  });
}

export function $selectionJustContainsSameCodeNode(
  selection: RangeSelection,
): boolean {
  if (!$isRangeSelection(selection)) return false;

  const anchorNode = selection.anchor.getNode(),
    focusNode = selection.focus.getNode(),
    anchorTopNode = $findNearestCodeNode(anchorNode),
    focusTopNode = $findNearestCodeNode(focusNode);
  return anchorTopNode === focusTopNode && $isCodePlusNode(anchorTopNode);
}

export function $isSelectedAll(root: RootNode, selection: RangeSelection) {
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

export function $findNearestListNode(
  node: LexicalNode | null,
): SimpleListNode | null {
  if (!node) return null;

  if ($isSimpleListNode(node)) return node;

  if ($isSimpleListItemNode(node)) {
    const parent = node.getParent();
    return $isSimpleListNode(parent) ? parent : null;
  }

  let parent = node.getParent();
  if ($isSimpleListItemNode(parent)) {
    const listNode = parent.getParent();
    return $isSimpleListNode(listNode) ? listNode : null;
  }

  while (parent) {
    if ($isSimpleListItemNode(parent)) {
      const listNode = parent.getParent();
      return $isSimpleListNode(listNode) ? listNode : null;
    }

    if ($isSimpleListNode(parent)) {
      return parent;
    }

    parent = parent.getParent();
  }

  return null;
}

export function $findNearestListItemNode(
  node: LexicalNode,
): SimpleListItemNode | null {
  const matchingParent = $findMatchingParent(node, (parent) =>
    $isSimpleListItemNode(parent),
  );
  return matchingParent as SimpleListItemNode | null;
}

export function $findNearestCodeNode(node?: LexicalNode): CodePlusNode | null {
  if (!node) return null;

  const matchingParent = $findMatchingParent(node, (parent) =>
    $isCodePlusNode(parent),
  );
  return matchingParent as CodePlusNode | null;
}

export function $createNestedListWithDepth(listType: ListType, depth: number) {
  const innerList = $createSimpleListNode(listType),
    innerListItem = $createSimpleListItemNode();
  innerList.append(innerListItem);

  let outer = innerList;
  for (let i = 0; i < depth; i++) {
    const parentList = $createSimpleListNode(listType),
      parentListItem = $createSimpleListItemNode();

    parentList.append(parentListItem);

    parentListItem.append(outer);

    outer = parentList;
  }

  return {
    outerListNode: outer,
    innerListNode: innerList,
    innerListItemNode: innerListItem,
  };
}

export function $getAncestor<NodeType extends LexicalNode = LexicalNode>(
  node: LexicalNode,
  predicate: (ancestor: LexicalNode) => ancestor is NodeType,
) {
  let parent = node;
  while (parent !== null && parent.getParent() !== null && !predicate(parent)) {
    parent = parent.getParentOrThrow();
  }
  return predicate(parent) ? parent : null;
}

/**
 * Finds the nearest ancestral ListNode and returns it, throws an invariant if listItem is not a ListItemNode.
 * @param listItem - The node to be checked.
 * @returns The ListNode found.
 */
export function $getTopListNode(listItem: LexicalNode): SimpleListNode {
  let list = listItem.getParent<SimpleListNode>();

  if (!$isSimpleListNode(list)) {
    invariant(false, 'A ListItemNode must have a ListNode for a parent.');
  }

  let parent: SimpleListNode | null = list;

  while (parent !== null) {
    parent = parent.getParent();

    if ($isSimpleListNode(parent)) {
      list = parent;
    }
  }

  return list;
}

/**
 * Takes a deeply nested ListNode or ListItemNode and traverses up the branch to delete the first
 * ancestral ListNode (which could be the root ListNode) or ListItemNode with siblings, essentially
 * bringing the deeply nested node up the branch once. Would remove sublist if it has siblings.
 * Should not break ListItem -> List -> ListItem chain as empty List/ItemNodes should be removed on .remove().
 * @param sublist - The nested ListNode or ListItemNode to be brought up the branch.
 */
export function $removeHighestEmptyListParent(
  sublist: SimpleListItemNode | SimpleListNode,
) {
  // Nodes may be repeatedly indented, to create deeply nested lists that each
  // contain just one bullet.
  // Our goal is to remove these (empty) deeply nested lists. The easiest
  // way to do that is crawl back up the tree until we find a node that has siblings
  // (e.g. is actually part of the list contents) and delete that, or delete
  // the root of the list (if no list nodes have siblings.)
  let emptyListPtr = sublist;

  while (
    emptyListPtr.getNextSibling() == null &&
    emptyListPtr.getPreviousSibling() == null
  ) {
    const parent = emptyListPtr.getParent();

    if (
      parent == null ||
      !($isSimpleListItemNode(parent) || $isSimpleListNode(parent))
    ) {
      break;
    }

    emptyListPtr = parent;
  }

  emptyListPtr.remove();
}

export function $setBlocksTypeWith<T extends ElementNode>(
  selection: BaseSelection | null,
  $createElement: (node: ElementNode) => T | null,
): void {
  if (selection === null) {
    return;
  }
  // Selections tend to not include their containing blocks so we effectively
  // expand it here
  const anchorAndFocus = selection.getStartEndPoints();
  const blockMap = new Map<NodeKey, ElementNode>();
  let newSelection: RangeSelection | null = null;
  if (anchorAndFocus) {
    const [anchor, focus] = anchorAndFocus;
    newSelection = $createRangeSelection();
    newSelection.anchor.set(anchor.key, anchor.offset, anchor.type);
    newSelection.focus.set(focus.key, focus.offset, focus.type);
    const anchorBlock = $getAncestor(anchor.getNode(), INTERNAL_$isBlock);
    const focusBlock = $getAncestor(focus.getNode(), INTERNAL_$isBlock);
    if ($isElementNode(anchorBlock)) {
      blockMap.set(anchorBlock.getKey(), anchorBlock);
    }
    if ($isElementNode(focusBlock)) {
      blockMap.set(focusBlock.getKey(), focusBlock);
    }
  }

  for (const node of selection.getNodes()) {
    if ($isElementNode(node) && INTERNAL_$isBlock(node)) {
      blockMap.set(node.getKey(), node);
    } else if (anchorAndFocus === null) {
      const ancestorBlock = $getAncestor(node, INTERNAL_$isBlock);
      if ($isElementNode(ancestorBlock)) {
        blockMap.set(ancestorBlock.getKey(), ancestorBlock);
      }
    }
  }

  for (const [key, prevNode] of blockMap) {
    const element = $createElement(prevNode);
    if (element && newSelection) {
      if (key === newSelection.anchor.key) {
        newSelection.anchor.set(
          element.getKey(),
          newSelection.anchor.offset,
          newSelection.anchor.type,
        );
      }
      if (key === newSelection.focus.key) {
        newSelection.focus.set(
          element.getKey(),
          newSelection.focus.offset,
          newSelection.focus.type,
        );
      }
    }
  }
  if (newSelection && selection.is($getSelection())) {
    $setSelection(newSelection);
  }
}

export function $getSelectionAllNodesByBlock(
  selection: RangeSelection,
): LexicalNode[] {
  if (!$isRangeSelection(selection)) return [];

  const nodes = selection.getNodes();
  const blockSet = new Map<string, ElementNode>();

  for (const node of nodes) {
    const block = node.getTopLevelElement() as ElementNode;
    if (block) {
      blockSet.set(block.getKey(), block);
    }
  }

  const blocks = Array.from(blockSet.values()).sort((a, b) => {
    return a.isBefore(b) ? -1 : 1;
  });

  const result: LexicalNode[] = [];

  for (const block of blocks) {
    result.push(...block.getChildren());
  }

  return result;
}

export function $getSelectedTopLevelElements(selection: RangeSelection) {
  if (!$isRangeSelection(selection)) return [];

  const nodes = selection.getNodes();
  const topLevelSet = new Set<ElementNode | DecoratorNode<unknown>>();

  for (const node of nodes) {
    const top = node.getTopLevelElement();
    if (top) {
      topLevelSet.add(top);
    }
  }

  return Array.from(topLevelSet);
}

export function $toggleOrderedList(
  selection: BaseSelection | null,
  isOrderedList?: boolean,
) {
  if (isOrderedList) {
    $setBlocksTypeWith(selection, (preNode) => {
      if ($isCodePlusNode(preNode)) {
        if (preNode.getTopLevelElement() === preNode) return null;
        const topListNode = $getTopListNode(preNode.getParent()!);
        if (!topListNode) return null;
        topListNode.replace(preNode);
        return preNode;
      }

      if (!$isSimpleListItemNode(preNode)) return null;

      const preTopNode = preNode.getTopLevelElementOrThrow();
      if (!$isSimpleListNode(preTopNode)) {
        const topListNode = $getTopListNode(preNode);
        preTopNode.append(...preNode.getChildren());
        topListNode.remove();
        return preTopNode;
      } else {
        const paragraph = $createParagraphNode();
        paragraph.append(...preNode.getChildren());
        preTopNode.insertBefore(paragraph);
        preTopNode.remove();
        return paragraph;
      }
    });
  } else {
    $setBlocksTypeWith(selection, (preNode) => {
      if ($isSimpleListItemNode(preNode)) {
        let parent = preNode.getParent();
        while (parent) {
          if ($isSimpleListNode(parent)) {
            parent.setListType('number');
          }
          parent = parent.getParent();
        }
        return null;
      }

      const preTopNode = preNode.getTopLevelElementOrThrow();
      if ($isSimpleQuoteNode(preTopNode)) {
        const { outerListNode, innerListItemNode } = $createNestedListWithDepth(
          'number',
          0,
        );
        if ($isCodePlusNode(preNode)) {
          innerListItemNode.append(preNode);
          preTopNode.clear();
          preTopNode.append(outerListNode);
        } else {
          innerListItemNode.append(...preTopNode.getChildren());
          preTopNode.append(outerListNode);
        }
        return preTopNode;
      }

      if ($isCodePlusNode(preNode)) {
        const { outerListNode, innerListItemNode } = $createNestedListWithDepth(
          'number',
          0,
        );
        preTopNode.replace(outerListNode);
        innerListItemNode.append(preNode);
        return outerListNode;
      }

      const { outerListNode, innerListItemNode } = $createNestedListWithDepth(
        'number',
        0,
      );
      innerListItemNode.append(...preTopNode.getChildren());
      preTopNode.replace(outerListNode);
      return outerListNode;
    });
  }
}

export function $toggleButtletedList(
  selection: BaseSelection | null,
  isBulletList?: boolean,
) {
  if (isBulletList) {
    $setBlocksTypeWith(selection, (preNode) => {
      if ($isCodePlusNode(preNode)) {
        if (preNode.getTopLevelElement() === preNode) return null;
        const topListNode = $getTopListNode(preNode.getParent()!);
        if (!topListNode) return null;
        topListNode.replace(preNode);
        return preNode;
      }

      if (!$isSimpleListItemNode(preNode)) return null;

      const preTopNode = preNode.getTopLevelElementOrThrow();
      if (!$isSimpleListNode(preTopNode)) {
        const topListNode = $getTopListNode(preNode);
        preTopNode.append(...preNode.getChildren());
        topListNode.remove();
        return preTopNode;
      } else {
        const paragraph = $createParagraphNode();
        paragraph.append(...preNode.getChildren());
        preTopNode.insertBefore(paragraph);
        preTopNode.remove();
        return paragraph;
      }
    });
  } else {
    $setBlocksTypeWith(selection, (preNode) => {
      if ($isSimpleListItemNode(preNode)) {
        let parent = preNode.getParent();
        while (parent) {
          if ($isSimpleListNode(parent)) {
            parent.setListType('bullet');
          }
          parent = parent.getParent();
        }
        return null;
      }

      const preTopNode = preNode.getTopLevelElementOrThrow();
      if ($isSimpleQuoteNode(preTopNode)) {
        const { outerListNode, innerListItemNode } = $createNestedListWithDepth(
          'bullet',
          0,
        );
        if ($isCodePlusNode(preNode)) {
          innerListItemNode.append(preNode);
          preTopNode.clear();
          preTopNode.append(outerListNode);
        } else {
          innerListItemNode.append(...preTopNode.getChildren());
          preTopNode.append(outerListNode);
        }
        return preTopNode;
      }

      if ($isCodePlusNode(preNode)) {
        const { outerListNode, innerListItemNode } = $createNestedListWithDepth(
          'bullet',
          0,
        );
        preTopNode.replace(outerListNode);
        innerListItemNode.append(preNode);
        return outerListNode;
      }

      const { outerListNode, innerListItemNode } = $createNestedListWithDepth(
        'bullet',
        0,
      );
      innerListItemNode.append(...preTopNode.getChildren());
      preTopNode.replace(outerListNode);
      return outerListNode;
    });
  }
}

export function $toggleQuoteNode(
  selection: BaseSelection | null,
  isQuoteNode?: boolean,
) {
  if (isQuoteNode) {
    $setBlocksTypeWith(selection, (preNode) => {
      const preTopNode = preNode.getTopLevelElementOrThrow();
      if (!$isSimpleQuoteNode(preTopNode)) return null;

      if ($isCodePlusNode(preNode)) {
        if (preNode.getParent()?.getKey() === preTopNode.getKey()) {
          $copyBlockFormatIndent(preTopNode, preNode);
          preTopNode.replace(preNode, true);
          return preNode;
        }

        // just `ListNode` and `QuoteNode` can contain `CodeNode`
        const blockNode = preTopNode.getFirstChildOrThrow<SimpleListNode>();
        $copyBlockFormatIndent(preTopNode, blockNode);
        preTopNode.replace(blockNode, true);
        return blockNode;
      }

      if ($isSimpleListItemNode(preNode)) {
        const listNode = $getTopListNode(preNode);
        preTopNode.replace(listNode);
        return listNode;
      }

      const paragraph = $createParagraphNode();
      $copyBlockFormatIndent(preTopNode, paragraph);
      preTopNode.replace(paragraph, true);
      return paragraph;
    });
  } else {
    $setBlocksTypeWith(selection, (preNode) => {
      const preTopNode = preNode.getTopLevelElementOrThrow();
      if ($isSimpleQuoteNode(preTopNode)) return null;

      if ($isSimpleListItemNode(preNode) || $isSimpleListNode(preTopNode)) {
        const quoteNode = $createSimpleQuoteNode();
        preTopNode.insertBefore(quoteNode);
        quoteNode.append(preTopNode);
        return quoteNode;
      }

      if ($isCodePlusNode(preNode) || $isCodePlusNode(preTopNode)) {
        const quoteNode = $createSimpleQuoteNode();
        preTopNode.insertBefore(quoteNode);
        quoteNode.append(preTopNode);
        return quoteNode;
      }

      const quoteNode = $createSimpleQuoteNode();
      $copyBlockFormatIndent(preTopNode, quoteNode);
      preTopNode.replace(quoteNode, true);
      return quoteNode;
    });
  }
}

export function $toggleCodeNode(
  selection: RangeSelection,
  isCodeNode?: boolean,
) {
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();

  if (isCodeNode) {
    const topLevelNode = anchorNode.getTopLevelElement(),
      codeNode = $findNearestCodeNode(anchorNode);

    if (topLevelNode === null || codeNode === null) return;

    if (topLevelNode === codeNode) {
      // `CodeNode` already is the top level node
      const paragraph = $createParagraphNode();
      paragraph.append(...codeNode?.getChildren());
      codeNode.replace(paragraph);
      paragraph.selectEnd();
      return;
    }

    // `QuoteNode` or `ListNode`
    const children = codeNode.getChildren();
    const { firstLine, rest } = parseFirstLineFromCodeChildren(children);

    const parent = codeNode.getParent();
    codeNode.remove();
    if ($isSimpleListItemNode(parent)) {
      const listItem = $createSimpleListItemNode();
      listItem.append(...firstLine);
      parent.replace(listItem);
    } else {
      parent?.append(...firstLine);
    }

    if (rest.length > 0) {
      const paragraph = $createParagraphNode();
      paragraph.append(...rest);
      topLevelNode.insertAfter(paragraph);
      paragraph.selectEnd();
    } else {
      parent?.selectEnd();
    }
  } else {
    const text = selection.getTextContent();
    if (!text) return;

    const isBackward = selection.isBackward();

    const children = $getSelectionAllNodesByBlock(selection);
    const selectedNodes = selection.getNodes();

    const startIndex = Math.min(
        children.indexOf(anchorNode),
        children.indexOf(focusNode),
      ),
      endIndex = Math.max(
        children.indexOf(anchorNode),
        children.indexOf(focusNode),
      );
    const startNode = isBackward ? focusNode : anchorNode,
      endNode = isBackward ? anchorNode : focusNode,
      leftNodes: TextNode[] = [],
      rightNodes: TextNode[] = [];

    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (!$isTextNode(node)) continue;

      if (node.getKey() === startNode.getKey()) {
        const textContent = startNode.getTextContent();

        if (node.getKey() === endNode.getKey()) {
          // both anchor and focus are same node
          const leftText = textContent.slice(
              0,
              Math.min(selection.anchor.offset, selection.focus.offset),
            ),
            rightText = textContent.slice(
              Math.max(selection.anchor.offset, selection.focus.offset),
            );

          if (leftText) {
            leftNodes.push($createTextNode(leftText));
          }
          if (rightText !== '') {
            rightNodes.push($createTextNode(rightText));
          }
        } else {
          const offset = isBackward
            ? selection.focus.offset
            : selection.anchor.offset;

          const newTextContent = textContent.slice(0, offset);
          if (newTextContent) {
            leftNodes.push($createTextNode(newTextContent));
          }
        }

        continue;
      }

      if (node.getKey() === endNode.getKey()) {
        const textContent = endNode.getTextContent();

        const offset = isBackward
          ? selection.anchor.offset
          : selection.focus.offset;
        const newTextContent = textContent.slice(offset);
        if (newTextContent) {
          rightNodes.push($createTextNode(newTextContent));
        }
        continue;
      }

      // left not selected nodes
      if (i < startIndex) {
        leftNodes.push(node);
        continue;
      }
      // right not selected nodes
      if (i > endIndex) {
        rightNodes.push(node);
        continue;
      }
      // selected nodes
      if (selectedNodes.indexOf(node) !== -1) {
        const topNode = node.getTopLevelElement();
        if (
          topNode?.getKey() !== startNode.getTopLevelElement()?.getKey() &&
          topNode?.getKey() !== endNode.getTopLevelElement()?.getKey()
        ) {
          node.getTopLevelElement()?.remove();
        } else {
          node.remove();
        }
        continue;
      }
    }

    const startBlockNode = startNode.getTopLevelElementOrThrow();
    // create code node
    const codePlusNode = $createCodePlusNode();
    codePlusNode.append($createTextNode(text));
    startBlockNode.insertAfter(codePlusNode);

    if (leftNodes.length > 0) {
      const paragraph = $createParagraphNode();
      paragraph.append(...leftNodes);
      startBlockNode.replace(paragraph);
      paragraph.insertAfter(codePlusNode);
    } else {
      startBlockNode.insertAfter(codePlusNode);
      if (startBlockNode.getPreviousSibling() === null) {
        codePlusNode.insertBefore($createParagraphNode());
      }
      startBlockNode.remove();
    }

    endNode.getTopLevelElement()?.remove();

    if (rightNodes.length > 0) {
      const paragraph = $createParagraphNode();
      paragraph.append(...rightNodes);
      codePlusNode.insertAfter(paragraph);
    } else {
      if (codePlusNode.getNextSibling() === null) {
        codePlusNode.insertAfter($createParagraphNode());
      }
    }

    codePlusNode.selectEnd();
  }
}

function parseFirstLineFromCodeChildren(children: LexicalNode[]) {
  for (let i = 0; i < children.length; i++) {
    if ($isLineBreakNode(children[i])) {
      return {
        firstLine: children.slice(0, i),
        rest: children.slice(i + 1),
      };
    }
  }

  return {
    firstLine: children,
    rest: [],
  };
}

export function $recomputeOrderedListNumbers() {
  const root = $getRoot();
  const children = root.getChildren();
  // console.log('children', children);

  const counters = new Map<number, number>(); // indent -> count

  for (const node of children) {
    let listNode = node;
    // `QuoteNode` can contain `ListNode`
    if ($isSimpleQuoteNode(node) && $isSimpleListNode(node.getFirstChild())) {
      const child = node.getFirstChild();
      if (child) {
        listNode = child;
      }
    }

    if ($isSimpleListNode(listNode) && listNode.getListType() === 'number') {
      const indent = $getListNodeDepth(listNode);
      const prev = counters.get(indent) ?? 0;
      const size = listNode.getChildrenSize();

      const start = prev + 1;
      if (listNode.getStart() !== start) {
        listNode.setStart(start);
      }

      counters.set(indent, prev + size);
    }
  }
}

function $getListNodeDepth(node: SimpleListNode) {
  let depth = 0,
    nextListNode = node;

  while (true) {
    const curNode = nextListNode
      .getFirstChild<SimpleListItemNode>()
      ?.getFirstChild();
    if ($isSimpleListNode(curNode)) {
      nextListNode = curNode;
      depth++;
      continue;
    }

    break;
  }

  return depth;
}

export function $copyCompleteNodeWithChildren(
  node:
    | ParagraphNode
    | SimpleListItemNode
    | SimpleListNode
    | SimpleQuoteNode
    | CodePlusNode,
  children: LexicalNode[] = [],
) {
  if (!node) return null;

  let current: LexicalNode | null = node;
  let innerClone: LexicalNode | null = null;
  let topClone: LexicalNode | null = null;

  while (current) {
    const cloned = $copyNode(current);

    if ($isElementNode(cloned)) {
      cloned.clear();

      if (!innerClone) {
        cloned.append(...children);
      } else {
        cloned.append(innerClone);
      }
    }

    innerClone = cloned;
    topClone = cloned;

    const parent: LexicalNode | null = current.getParent();
    if (!parent || $isRootNode(parent)) {
      break;
    }

    current = parent;
  }

  return topClone;
}

export function $splitNodesFromOneLine(
  children: LexicalNode[],
  anchorNode: LexicalNode,
  offset: number,
) {
  let leftNodes = [],
    rightNodes = [];

  let matched = false;
  for (const child of children) {
    if (child.is(anchorNode) || child.isParentOf(anchorNode)) {
      matched = true;

      if ($isTextNode(child)) {
        const textContent = child.getTextContent();
        const leftText = textContent.slice(0, offset),
          rightText = textContent.slice(offset);

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
          $splitLinkNodeBySelection(child, anchorNode, offset);

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

  return {
    leftNodes,
    rightNodes,
  };
}

export function $splitLinkNodeBySelection(
  linkNode: LinkNode,
  anchorNode: TextNode,
  offset: number,
) {
  const text = anchorNode.getTextContent();

  const leftText = text.slice(0, offset);
  const rightText = text.slice(offset);

  const leftNodes = [],
    rightNodes = [];

  if (rightText) {
    const rightTextNode = $copyNode(anchorNode);
    rightTextNode.setTextContent(rightText);
    rightNodes.push(rightTextNode);
  }

  let matched = false;
  for (const child of linkNode.getChildren()) {
    if (child.is(anchorNode)) {
      matched = true;
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

  if (leftText) {
    const leftTextNode = $copyNode(anchorNode);
    leftTextNode.setTextContent(leftText);
    leftNodes.push(leftTextNode);
  }

  return {
    leftNodes,
    rightNodes,
  };
}
