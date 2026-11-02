import { CodeHighlightNode } from '@lexical/code-core';
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  createEditor,
  type ElementNode,
} from 'lexical';
import { describe, expect, test } from 'vitest';

import {
  $createCodePlusNode,
  $createSimpleListItemNode,
  $createSimpleListNode,
  $createSimpleQuoteNode,
  CodePlusNode,
  SimpleListItemNode,
  SimpleListNode,
  SimpleQuoteNode,
} from '../nodes';
import { $toggleQuoteNode } from './lib';

describe.each(['direct', 'list', 'quote'] as const)(
  'removing a quote around code (container=%s)',
  (container) => {
    test('preserves the code content and list structure', () => {
      const editor = createEditor({
        namespace: 'quote-conversion-test',
        nodes: [
          CodePlusNode,
          CodeHighlightNode,
          SimpleQuoteNode,
          SimpleListNode,
          SimpleListItemNode,
        ],
        onError(error) {
          throw error;
        },
      });

      editor.update(
        () => {
          const root = $getRoot();
          const quote = $createSimpleQuoteNode();
          const code = $createCodePlusNode();
          code.append($createTextNode('const answer = 42;'));
          root.append(quote);
          let expectedBlock: ElementNode = code;
          if (container === 'list') {
            const list = $createSimpleListNode('bullet');
            const item = $createSimpleListItemNode();
            quote.append(list);
            list.append(item);
            item.append(code);
            expectedBlock = list;
          } else if (container === 'quote') {
            const innerQuote = $createSimpleQuoteNode();
            quote.append(innerQuote);
            innerQuote.append(code);
            expectedBlock = innerQuote;
          } else {
            quote.append(code);
          }

          code.selectStart();
          $toggleQuoteNode($getSelection(), true);
          expect(root.getFirstChild()?.is(expectedBlock)).toBe(true);
          expect(code.getTextContent()).toBe('const answer = 42;');
          expect(root.getTextContent()).toBe('const answer = 42;');
          expect(root.getChildrenSize()).toBe(1);
        },
        { discrete: true },
      );
    });
  },
);
