import {
  $create,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
} from 'lexical';

export class PreLinkNode extends ElementNode {
  static getType(): string {
    return 'pre-link';
  }

  static clone(node: PreLinkNode): PreLinkNode {
    return new PreLinkNode(node.__key);
  }

  static importJSON(): PreLinkNode {
    const node = $createPreLinkNode();
    return node;
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'bg-input';

    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): boolean {
    return true;
  }
}

export function $isPreLinkNode(
  node: LexicalNode | null | undefined,
): node is PreLinkNode {
  return node instanceof PreLinkNode;
}

export function $createPreLinkNode(): PreLinkNode {
  return $create(PreLinkNode);
}
