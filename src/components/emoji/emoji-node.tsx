import {
  $applyNodeReplacement,
  DecoratorNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  type LexicalNode,
  type DOMExportOutput,
} from 'lexical';
import { renderToStaticMarkup } from 'react-dom/server';
import { Emoji } from './emoji';

export type SerializedEmojiNode = Spread<
  { shortName: string },
  SerializedLexicalNode
>;

export class EmojiNode extends DecoratorNode<React.ReactNode> {
  __shortName: string;

  static getType() {
    return 'emoji';
  }

  static clone(node: EmojiNode) {
    return new EmojiNode(node.__shortName, node.__key);
  }

  constructor(shortName: string, key?: NodeKey) {
    super(key);
    this.__shortName = shortName;
  }

  createDOM(): HTMLElement {
    const node = document.createElement('span');
    node.className =
      'w-[18px] h-[18px] inline-flex justify-center items-center align-text-bottom';
    return node;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): React.ReactNode {
    return <Emoji shortName={this.__shortName} size={18} />;
  }

  static importJSON(serializedNode: SerializedEmojiNode): EmojiNode {
    return $createEmojiNode(serializedNode.shortName);
  }

  exportJSON(): SerializedEmojiNode {
    return {
      ...super.exportJSON(),
      shortName: this.__shortName,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.className =
      'w-[18px] h-[18px] inline-flex justify-center items-center align-text-bottom';
    element.innerHTML = renderToStaticMarkup(
      <Emoji shortName={this.__shortName} size={18} />,
    );

    return {
      element,
    };
  }
}

export function $createEmojiNode(shortName: string): EmojiNode {
  const node = new EmojiNode(shortName);
  return $applyNodeReplacement(node);
}

export function $isEmojiNode(
  node: LexicalNode | null | undefined,
): node is EmojiNode {
  return node instanceof EmojiNode;
}
