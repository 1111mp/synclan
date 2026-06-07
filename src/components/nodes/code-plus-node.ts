import {
  $create,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
} from 'lexical';
import { CodeNode } from '@lexical/code';

export class CodePlusNode extends CodeNode {
  __theme: string;

  static getType(): string {
    return 'code-plus';
  }

  constructor(
    language: string | null = 'text',
    theme: string = 'one-dark-pro',
    key?: NodeKey,
  ) {
    super(language, key);
    this.__theme = theme;
  }

  static clone(node: CodePlusNode): CodePlusNode {
    return new CodePlusNode(node.__language, node.__theme, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    return dom;
  }

  getTheme(): string | undefined {
    return this.__theme;
  }

  setTheme(theme: string): this {
    const writable = this.getWritable();
    writable.__theme = theme;
    return writable;
  }
}

export function $createCodePlusNode(
  language: string | null = 'text',
  theme: string = 'one-dark-pro',
): CodePlusNode {
  return $create(CodePlusNode).setLanguage(language).setTheme(theme);
}

export function $isCodePlusNode(
  node: LexicalNode | null | undefined,
): node is CodePlusNode {
  return node instanceof CodePlusNode;
}
