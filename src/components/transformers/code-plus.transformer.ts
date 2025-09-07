import { $createTextNode, ElementNode, type LexicalNode } from 'lexical';
import { $createCodePlusNode, $isCodePlusNode, CodePlusNode } from '../nodes';
import type {
  ElementTransformer,
  MultilineElementTransformer,
} from '@lexical/markdown';

const CODE_START_REGEX = /^[ \t]*```([\w-]+)?/;
const CODE_END_REGEX = /[ \t]*```$/;

const createBlockNode = (
  createNode: (match: Array<string>) => ElementNode,
): ElementTransformer['replace'] => {
  return (parentNode, children, match, isImport) => {
    const node = createNode(match);
    node.append(...children);
    parentNode.replace(node);
    if (!isImport) {
      node.select(0, 0);
    }
  };
};

export const CODE_PLUS: MultilineElementTransformer = {
  dependencies: [CodePlusNode],
  export: (node: LexicalNode) => {
    if (!$isCodePlusNode(node)) {
      return null;
    }
    const textContent = node.getTextContent();
    return (
      '```' +
      (node.getLanguage() || '') +
      (textContent ? '\n' + textContent : '') +
      '\n' +
      '```'
    );
  },
  regExpEnd: {
    optional: true,
    regExp: CODE_END_REGEX,
  },
  regExpStart: CODE_START_REGEX,
  replace: (
    rootNode,
    children,
    startMatch,
    endMatch,
    linesInBetween,
    isImport,
  ) => {
    let codeBlockNode: CodePlusNode;
    let code: string;

    if (!children && linesInBetween) {
      if (linesInBetween.length === 1) {
        // Single-line code blocks
        if (endMatch) {
          // End match on same line. Example: ```markdown hello```. markdown should not be considered the language here.
          codeBlockNode = $createCodePlusNode();
          code = startMatch[1] + linesInBetween[0];
        } else {
          // No end match. We should assume the language is next to the backticks and that code will be typed on the next line in the future
          codeBlockNode = $createCodePlusNode(startMatch[1]);
          code = linesInBetween[0].startsWith(' ')
            ? linesInBetween[0].slice(1)
            : linesInBetween[0];
        }
      } else {
        // Treat multi-line code blocks as if they always have an end match
        codeBlockNode = $createCodePlusNode(startMatch[1]);

        if (linesInBetween[0].trim().length === 0) {
          // Filter out all start and end lines that are length 0 until we find the first line with content
          while (linesInBetween.length > 0 && !linesInBetween[0].length) {
            linesInBetween.shift();
          }
        } else {
          // The first line already has content => Remove the first space of the line if it exists
          linesInBetween[0] = linesInBetween[0].startsWith(' ')
            ? linesInBetween[0].slice(1)
            : linesInBetween[0];
        }

        // Filter out all end lines that are length 0 until we find the last line with content
        while (
          linesInBetween.length > 0 &&
          !linesInBetween[linesInBetween.length - 1].length
        ) {
          linesInBetween.pop();
        }

        code = linesInBetween.join('\n');
      }
      const textNode = $createTextNode(code);
      codeBlockNode.append(textNode);
      rootNode.append(codeBlockNode);
    } else if (children) {
      createBlockNode((match) => {
        return $createCodePlusNode(match ? match[1] : undefined);
      })(rootNode, children, startMatch, isImport);
    }
  },
  type: 'multiline-element',
};
