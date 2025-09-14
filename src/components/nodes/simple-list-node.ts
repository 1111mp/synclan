import { ListNode, type ListType } from '@lexical/list';
import {
  $applyNodeReplacement,
  type DOMConversionMap,
  type LexicalNode,
  type NodeKey,
} from 'lexical';

// To avoid merge the next sibling list if same type.
export class SimpleListNode extends ListNode {
  $config() {
    return this.config('simple-list', {
      $transform: void 0,
      extends: ListNode,
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
