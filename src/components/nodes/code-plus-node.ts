import {
  $create,
  $createLineBreakNode,
  $createParagraphNode,
  $createTabNode,
  $isRootNode,
  $isTabNode,
  $isTextNode,
  ParagraphNode,
  TabNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type RangeSelection,
} from 'lexical';
import {
  $createCodeHighlightNode,
  $getFirstCodeNodeOfLine,
  $isCodeHighlightNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
} from '@lexical/code';
import { $copyCompleteNodeWithChildren } from '../plugins/lib';
import type { SimpleListItemNode } from './simple-list-item-node';
import type { SimpleQuoteNode } from './simple-quote-node';

export class CodePlusNode extends CodeNode {
  __theme: string;
  __pendingDelete: boolean;

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
    this.__pendingDelete = false;
  }

  static clone(node: CodePlusNode): CodePlusNode {
    return new CodePlusNode(node.__language, node.__theme, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    return dom;
  }

  getTheme(): string | undefined {
    return this.getLatest().__theme;
  }

  setTheme(theme: string): this {
    const writable = this.getWritable();
    writable.__theme = theme;
    return writable;
  }

  // Mutation
  insertNewAfter(
    selection: RangeSelection,
    restoreSelection = true,
  ): null | ParagraphNode | CodeHighlightNode | TabNode {
    const children = this.getChildren();
    const childrenLength = children.length;

    if (
      childrenLength >= 2 &&
      children[childrenLength - 1].getTextContent() === '\n' &&
      children[childrenLength - 2].getTextContent() === '\n' &&
      selection.isCollapsed() &&
      selection.anchor.key === this.__key &&
      selection.anchor.offset === childrenLength
    ) {
      children[childrenLength - 1].remove();
      children[childrenLength - 2].remove();
      const parent = this.getParent();
      if (!parent) return null;

      if ($isRootNode(parent)) {
        const newElement = $createParagraphNode();
        this.insertAfter(newElement, restoreSelection);
        return newElement;
      } else {
        const newNode = $copyCompleteNodeWithChildren(
          parent as SimpleQuoteNode | SimpleListItemNode,
        );
        if (newNode) {
          console.log(newNode);
          this.getTopLevelElementOrThrow().insertAfter(newNode);
          newNode.selectEnd();
        }
      }
    }

    // If the selection is within the codeblock, find all leading tabs and
    // spaces of the current line. Create a new line that has all those
    // tabs and spaces, such that leading indentation is preserved.
    const { anchor, focus } = selection;
    const firstPoint = anchor.isBefore(focus) ? anchor : focus;
    const firstSelectionNode = firstPoint.getNode();
    if ($isTextNode(firstSelectionNode)) {
      let node: null | LexicalNode =
        $getFirstCodeNodeOfLine(firstSelectionNode);
      const insertNodes = [];
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if ($isTabNode(node)) {
          insertNodes.push($createTabNode());
          node = node.getNextSibling();
        } else if ($isCodeHighlightNode(node)) {
          let spaces = 0;
          const text = node.getTextContent();
          const textSize = node.getTextContentSize();
          while (spaces < textSize && text[spaces] === ' ') {
            spaces++;
          }
          if (spaces !== 0) {
            insertNodes.push($createCodeHighlightNode(' '.repeat(spaces)));
          }
          if (spaces !== textSize) {
            break;
          }
          node = node.getNextSibling();
        } else {
          break;
        }
      }
      const split = firstSelectionNode.splitText(anchor.offset)[0];
      const x = anchor.offset === 0 ? 0 : 1;
      const index = split.getIndexWithinParent() + x;
      const codeNode = firstSelectionNode.getParentOrThrow();
      const nodesToInsert = [$createLineBreakNode(), ...insertNodes];
      codeNode.splice(index, 0, nodesToInsert);
      const last = insertNodes[insertNodes.length - 1];
      if (last) {
        last.select();
      } else if (anchor.offset === 0) {
        split.selectPrevious();
      } else {
        split.getNextSibling()!.selectNext(0, 0);
      }
    }
    if ($isCodeNode(firstSelectionNode)) {
      const { offset } = selection.anchor;
      firstSelectionNode.splice(offset, 0, [$createLineBreakNode()]);
      firstSelectionNode.select(offset + 1, offset + 1);
    }

    return null;
  }

  collapseAtStart(): boolean {
    if (this.getPendingDelete()) {
      const paragraph = $createParagraphNode();
      const children = this.getChildren();
      children.forEach((child) => paragraph.append(child));
      this.replace(paragraph);
      return true;
    }
    return false;
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
