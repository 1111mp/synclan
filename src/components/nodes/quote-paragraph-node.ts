import {
  $create,
  ParagraphNode,
  type LexicalNode,
  type NodeKey,
  type SerializedParagraphNode,
} from 'lexical';

export class QuoteParagraphNode extends ParagraphNode {
  static getType(): string {
    return 'quote-paragraph';
  }

  static clone(node: QuoteParagraphNode): QuoteParagraphNode {
    return new QuoteParagraphNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  static importJSON(serializedNode: SerializedParagraphNode): ParagraphNode {
    return $createQuoteParagraphNode().updateFromJSON(serializedNode);
  }
}

export function $isQuoteParagraphNode(
  node: LexicalNode | null | undefined,
): node is QuoteParagraphNode {
  return node instanceof QuoteParagraphNode;
}

export function $createQuoteParagraphNode() {
  return $create(QuoteParagraphNode);
}
