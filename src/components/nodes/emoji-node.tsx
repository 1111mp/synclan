import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  ElementNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import { renderToStaticMarkup } from 'react-dom/server';

import { Emoji } from '../emoji';

export type SerializedEmojiNode = Spread<
  { shortName: string; skinTone: number },
  SerializedLexicalNode
>;

export class EmojiNode extends DecoratorNode<React.ReactNode> {
  __shortName: string;
  __skinTone: number;

  static getType() {
    return 'emoji';
  }

  static clone(node: EmojiNode) {
    return new EmojiNode(node.__shortName, node.__skinTone, node.__key);
  }

  constructor(shortName: string, skinTone: number, key?: NodeKey) {
    super(key);
    this.__shortName = shortName;
    this.__skinTone = skinTone;
  }

  isKeyboardSelectable(): boolean {
    return false;
  }

  getTextContent(): string {
    return `[${this.__shortName}]`;
  }

  createDOM(): HTMLElement {
    const node = document.createElement('span');
    node.className =
      'w-[22px] h-[18px] inline-flex justify-center items-center align-text-top';
    return node;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): React.ReactNode {
    return (
      <Emoji
        shortName={this.__shortName}
        skinTone={this.__skinTone}
        size={18}
      />
    );
  }

  static importJSON(serializedNode: SerializedEmojiNode): EmojiNode {
    return $createEmojiNode(serializedNode.shortName, serializedNode.skinTone);
  }

  exportJSON(): SerializedEmojiNode {
    return {
      ...super.exportJSON(),
      shortName: this.__shortName,
      skinTone: this.__skinTone,
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
      <Emoji
        shortName={this.__shortName}
        skinTone={this.__skinTone}
        size={18}
      />,
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
  const skinTone = parseInt(img.getAttribute('data-tone') || '0');
  if (!shortName) return null;

  return { node: $createEmojiNode(shortName, skinTone) };
}

export function $childrenIncludeEmojiNode(node: ElementNode): boolean {
  return node.getChildren().some((c) => $isEmojiNode(c));
}

export function $createEmojiNode(
  shortName: string,
  skinTone: number = 0,
): EmojiNode {
  const node = new EmojiNode(shortName, skinTone);
  return $applyNodeReplacement(node);
}

export function $isEmojiNode(
  node: LexicalNode | null | undefined,
): node is EmojiNode {
  return node instanceof EmojiNode;
}
