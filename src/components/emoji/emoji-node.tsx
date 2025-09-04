import {
  $applyNodeReplacement,
  DecoratorNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  type LexicalNode,
  type DOMExportOutput,
  type DOMConversionMap,
  type DOMConversionOutput,
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
      'size-[18px] inline-flex justify-center items-center align-text-bottom';
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

  static importDOM(): DOMConversionMap | null {
    return {
      span: () => ({
        conversion: $convertEmojiElement,
        priority: 0,
      }),
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

function $convertEmojiElement(domNode: Node): null | DOMConversionOutput {
  if (!(domNode instanceof HTMLElement)) return null;

  if (domNode.nodeName.toLowerCase() !== 'span') return null;

  const img = domNode.querySelector('img');
  if (!img) return null;

  const shortName = img.getAttribute('data-short-name');
  if (!shortName) return null;

  return { node: $createEmojiNode(shortName) };
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
