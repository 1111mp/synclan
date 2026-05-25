import { $isListItemNode, ListItemNode } from '@lexical/list';
import {
  $applyNodeReplacement,
  $createParagraphNode,
  type LexicalNode,
  type NodeKey,
  type RangeSelection,
} from 'lexical';
import { $isSimpleQuoteNode } from './simple-quote-node';

export class SimpleListItemNode extends ListItemNode {
  static getType(): string {
    return 'simple-list-item';
  }

  constructor(value: number = 1, checked?: boolean, key?: NodeKey) {
    super(value, checked, key);
  }

  // Rewrite `collapseAtStart`
  collapseAtStart(selection: RangeSelection): true {
    const paragraph = $createParagraphNode();
    const children = this.getChildren();
    children.forEach((child) => paragraph.append(child));
    const listNode = this.getParentOrThrow();
    const listNodeParent = listNode.getParentOrThrow();
    const isIndented = $isListItemNode(listNodeParent);

    if (listNode.getChildrenSize() === 1) {
      if (isIndented) {
        // if the list node is nested, we just want to remove it,
        // effectively unindenting it.
        listNode.remove();
        listNodeParent.select();
      } else if ($isSimpleQuoteNode(listNodeParent)) {
        listNode.remove();
        // listNodeParent.setPendingDelete(true);
        listNodeParent.select();
      } else {
        listNode.insertBefore(paragraph);
        listNode.remove();
        // If we have selection on the list item, we'll need to move it
        // to the paragraph
        const anchor = selection.anchor;
        const focus = selection.focus;
        const key = paragraph.getKey();

        if (anchor.type === 'element' && anchor.getNode().is(this)) {
          anchor.set(key, anchor.offset, 'element');
        }

        if (focus.type === 'element' && focus.getNode().is(this)) {
          focus.set(key, focus.offset, 'element');
        }
      }
    } else {
      listNode.insertBefore(paragraph);
      this.remove();
    }

    return true;
  }
}

export function $createSimpleListItemNode(
  checked?: boolean,
): SimpleListItemNode {
  return $applyNodeReplacement(new SimpleListItemNode(undefined, checked));
}

export function $isSimpleListItemNode(
  node: LexicalNode | null | undefined,
): node is SimpleListItemNode {
  return node instanceof SimpleListItemNode;
}
