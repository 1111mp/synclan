import {
  $applyNodeReplacement,
  $createParagraphNode,
  type LexicalNode,
} from 'lexical';
import { QuoteNode } from '@lexical/rich-text';

export class SimpleQuoteNode extends QuoteNode {
  __pendingDelete: boolean = false;

  static getType(): string {
    return 'simple-quote';
  }

  collapseAtStart(): true {
    if (this.getPendingDelete()) {
      const paragraph = $createParagraphNode();
      const children = this.getChildren();
      children.forEach((child) => paragraph.append(child));
      this.replace(paragraph);
      return true;
    }

    this.setPendingDelete(true);
    return true;
  }

  setPendingDelete(pending: boolean) {
    const writable = this.getWritable();
    writable.__pendingDelete = pending;
    return writable;
  }

  getPendingDelete() {
    const latest = this.getLatest();
    return latest.__pendingDelete;
  }
}

export function $isSimpleQuoteNode(
  node: LexicalNode | null | undefined,
): node is SimpleQuoteNode {
  return node instanceof SimpleQuoteNode;
}

export function $createSimpleQuoteNode(): SimpleQuoteNode {
  return $applyNodeReplacement(new SimpleQuoteNode());
}
