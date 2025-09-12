// import {
//   $applyNodeReplacement,
//   DecoratorNode,
//   type NodeKey,
//   type SerializedLexicalNode,
//   type Spread,
//   type LexicalNode,
//   type DOMExportOutput,
//   type DOMConversionMap,
//   type DOMConversionOutput,
// } from 'lexical';
// import { Emoji } from '../emoji';
// import { renderToStaticMarkup } from 'react-dom/server';

// export type SerializedEmojiNode = Spread<
//   { shortName: string; skinTone: number },
//   SerializedLexicalNode
// >;

// export class EmojiNode extends DecoratorNode<React.ReactNode> {
//   __shortName: string;
//   __skinTone: number;

//   static getType() {
//     return 'emoji';
//   }

//   static clone(node: EmojiNode) {
//     return new EmojiNode(node.__shortName, node.__skinTone, node.__key);
//   }

//   constructor(shortName: string, skinTone: number, key?: NodeKey) {
//     super(key);
//     this.__shortName = shortName;
//     this.__skinTone = skinTone;
//     this
//   }

//   createDOM(): HTMLElement {
//     const node = document.createElement('span');
//     node.className =
//       'size-[18px] mx-1 inline-flex justify-center items-center align-text-bottom';
//     return node;
//   }

//   updateDOM(): boolean {
//     return false;
//   }

//   decorate(): React.ReactNode {
//     return (
//       <Emoji
//         shortName={this.__shortName}
//         skinTone={this.__skinTone}
//         size={18}
//       />
//     );
//   }

//   static importJSON(serializedNode: SerializedEmojiNode): EmojiNode {
//     return $createEmojiNode(serializedNode.shortName, serializedNode.skinTone);
//   }

//   exportJSON(): SerializedEmojiNode {
//     return {
//       ...super.exportJSON(),
//       shortName: this.__shortName,
//       skinTone: this.__skinTone,
//     };
//   }

//   static importDOM(): DOMConversionMap | null {
//     return {
//       span: () => ({
//         conversion: $convertEmojiElement,
//         priority: 0,
//       }),
//     };
//   }

//   exportDOM(): DOMExportOutput {
//     const element = document.createElement('span');
//     element.className =
//       'w-[18px] h-[18px] inline-flex justify-center items-center align-text-bottom';
//     element.innerHTML = renderToStaticMarkup(
//       <Emoji
//         shortName={this.__shortName}
//         skinTone={this.__skinTone}
//         size={18}
//       />,
//     );

//     return {
//       element,
//     };
//   }
// }

// function $convertEmojiElement(domNode: Node): null | DOMConversionOutput {
//   if (!(domNode instanceof HTMLElement)) return null;

//   if (domNode.nodeName.toLowerCase() !== 'span') return null;

//   const img = domNode.querySelector('img');
//   if (!img) return null;

//   const shortName = img.getAttribute('data-short-name');
//   const skinTone = parseInt(img.getAttribute('data-tone') || '0');
//   if (!shortName) return null;

//   return { node: $createEmojiNode(shortName, skinTone) };
// }

// export function $createEmojiNode(
//   shortName: string,
//   skinTone: number = 0,
// ): EmojiNode {
//   const node = new EmojiNode(shortName, skinTone);
//   return $applyNodeReplacement(node);
// }

// export function $isEmojiNode(
//   node: LexicalNode | null | undefined,
// ): node is EmojiNode {
//   return node instanceof EmojiNode;
// }

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
  TextNode,
  type EditorConfig,
  type SerializedTextNode,
} from 'lexical';
import { renderToStaticMarkup } from 'react-dom/server';
import { Emoji } from '@/components';
import { getImagePath, skinTonesData } from '../emoji/lib';
import { cn } from '@/lib/utils';

export type SerializedEmojiNode = Spread<
  { shortName: string; skinTone: number },
  SerializedTextNode
>;

export class EmojiNode extends TextNode {
  __shortName: string;
  __skinTone: number;

  static getType() {
    return 'emoji';
  }

  static clone(node: EmojiNode) {
    return new EmojiNode(
      node.__shortName,
      node.__skinTone,
      node.__text,
      node.__key,
    );
  }

  constructor(
    shortName: string,
    skinTone: number,
    text: string,
    key?: NodeKey,
  ) {
    super(text, key);
    this.__shortName = shortName;
    this.__skinTone = skinTone;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const node = document.createElement('span');
    node.className =
      'size-[18px] inline-block align-text-bottom bg-center bg-no-repeat bg-size-[16px]';

    const inner = super.createDOM(config);
    inner.className = cn(
      'size-[18px] inline-block overflow-hidden text-transparent align-text-bottom caret-foreground',
      // 'before:size-[18px] before:absolute before:inline-block before:bg-red-500',
    );

    node.appendChild(inner);

    node.style.backgroundImage = `url(${getImagePath(this.__shortName, this.__skinTone)})`;

    return node;
  }
  // const img = document.createElement('img');
  // img.src = getImagePath(this.__shortName, this.__skinTone);
  // img.className = 'transform-gpu align-baseline size-[18px]';
  // img.title = this.__shortName;
  // img.setAttribute('data-short-name', this.__shortName);
  // img.setAttribute('data-tone', skinTonesData[this.__skinTone]);

  // updateDOM(): boolean {
  //   return false;
  // }

  static importJSON(serializedNode: SerializedEmojiNode): EmojiNode {
    return $createEmojiNode(
      serializedNode.shortName,
      serializedNode.text,
      serializedNode.skinTone,
    ).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedEmojiNode {
    return {
      ...super.exportJSON(),
      shortName: this.__shortName,
      skinTone: this.__skinTone,
    };
  }

  // static importDOM(): DOMConversionMap | null {
  //   return {
  //     span: () => ({
  //       conversion: $convertEmojiElement,
  //       priority: 0,
  //     }),
  //   };
  // }

  // exportDOM(): DOMExportOutput {
  //   const element = document.createElement('span');
  //   element.className =
  //     'w-[18px] h-[18px] inline-flex justify-center items-center align-text-bottom';
  //   element.innerHTML = renderToStaticMarkup(
  //     <Emoji
  //       shortName={this.__shortName}
  //       skinTone={this.__skinTone}
  //       size={18}
  //     />,
  //   );

  //   return {
  //     element,
  //   };
  // }
}

// function $convertEmojiElement(domNode: Node): null | DOMConversionOutput {
//   if (!(domNode instanceof HTMLElement)) return null;

//   if (domNode.nodeName.toLowerCase() !== 'span') return null;

//   const img = domNode.querySelector('img');
//   if (!img) return null;

//   const shortName = img.getAttribute('data-short-name');
//   const skinTone = parseInt(img.getAttribute('data-tone') || '0');
//   if (!shortName) return null;

//   return { node: $createEmojiNode(shortName, skinTone) };
// }

export function $isEmojiNode(
  node: LexicalNode | null | undefined,
): node is EmojiNode {
  return node instanceof EmojiNode;
}

export function $createEmojiNode(
  shortName: string,
  emojiText: string,
  skinTone: number = 0,
): EmojiNode {
  const node = new EmojiNode(shortName, skinTone, emojiText).setMode('token');
  return $applyNodeReplacement(node);
}
