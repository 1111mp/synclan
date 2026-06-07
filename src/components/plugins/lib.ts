/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {
  $createRangeSelection,
  $getSelection,
  $isElementNode,
  $setSelection,
  INTERNAL_$isBlock,
  type BaseSelection,
  type ElementNode,
  type LexicalNode,
  type NodeKey,
  type RangeSelection,
  type TextNode,
} from 'lexical';
import { $isAtNodeEnd } from '@lexical/selection';
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
  type ListType,
} from '@lexical/list';
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

export function getSelectedNode(
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

export function $findNearestListItemNode(
  node: LexicalNode,
): ListItemNode | null {
  const matchingParent = $findMatchingParent(node, (parent) =>
    $isListItemNode(parent),
  );
  return matchingParent as ListItemNode | null;
}

export function $createNestedListWithDepth(listType: ListType, depth: number) {
  const innerList = $createListNode(listType),
    innerListItem = $createListItemNode();
  innerList.append(innerListItem);

  let outer = innerList;
  for (let i = 0; i < depth; i++) {
    const parentList = $createListNode(listType),
      parentListItem = $createListItemNode();

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
export function $getTopListNode(listItem: LexicalNode): ListNode {
  let list = listItem.getParent<ListNode>();

  if (!$isListNode(list)) {
    invariant(false, 'A ListItemNode must have a ListNode for a parent.');
  }

  let parent: ListNode | null = list;

  while (parent !== null) {
    parent = parent.getParent();

    if ($isListNode(parent)) {
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
  sublist: ListItemNode | ListNode,
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

    if (parent == null || !($isListItemNode(parent) || $isListNode(parent))) {
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
