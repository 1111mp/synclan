import {
  $applyNodeReplacement,
  ElementNode,
  type DOMConversionMap,
  type LexicalNode,
  type NodeKey,
} from 'lexical';
import { ListNode, type ListType } from '@lexical/list';
import { $isSimpleListItemNode } from './simple-list-item-node';

// To avoid merge the next sibling list if same type.
export class SimpleListNode extends ListNode {
  $config() {
    return this.config('simple-list', {
      $transform: (node: SimpleListNode) => {
        updateChildrenListItemValue(node);
      },
      extends: ElementNode,
      importDOM: super.$config().importDOM as DOMConversionMap,
    });
  }

  constructor(listType: ListType = 'number', start?: number, key?: NodeKey) {
    super(listType, start, key);
  }
}

export function $isSimpleListNode(
  node: LexicalNode | null | undefined,
): node is SimpleListNode {
  return node instanceof SimpleListNode;
}

export function $createSimpleListNode(
  listType: ListType = 'number',
  start = 1,
) {
  return $applyNodeReplacement(new SimpleListNode(listType, start));
}

/**
 * Takes the value of a child ListItemNode and makes it the value the ListItemNode
 * should be if it isn't already. Also ensures that checked is undefined if the
 * parent does not have a list type of 'check'.
 * @param list - The list whose children are updated.
 */
export function updateChildrenListItemValue(list: SimpleListNode): void {
  const isNotChecklist = list.getListType() !== 'check';
  let value = list.getStart();
  for (const child of list.getChildren()) {
    if ($isSimpleListItemNode(child)) {
      if (child.getValue() !== value) {
        child.setValue(value);
      }
      if (isNotChecklist && child.getLatest().__checked != null) {
        child.setChecked(undefined);
      }
      if (!$isSimpleListNode(child.getFirstChild())) {
        value++;
      }
    }
  }
}
