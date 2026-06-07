import {
  DecoratorNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import { Emoji } from './emoji';

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
    return document.createElement('span');
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): React.ReactNode {
    return <Emoji shortName={this.__shortName} />;
  }

  exportJSON(): Spread<{ shortName: string }, SerializedLexicalNode> {
    return {
      ...super.exportJSON(),
      shortName: this.__shortName,
    };
  }
}

export function $createEmojiNode(shortName: string): EmojiNode {
  const node = new EmojiNode(shortName);
  return node;
}
