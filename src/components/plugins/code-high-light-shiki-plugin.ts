/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $createCodeNode,
  $isCodeHighlightNode,
  CodeIndentExtension,
} from '@lexical/code-core';
import {
  CodeShikiExtension,
  registerCodeHighlighting,
  ShikiTokenizer,
  type Tokenizer,
} from '@lexical/code-shiki';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getEditor,
  $isLineBreakNode,
  $isTabNode,
  configExtension,
  defineExtension,
} from 'lexical';
import { useEffect, type JSX } from 'react';

// Only cache small theme metadata, never message contents or editor-owned nodes.
const codeThemeStyles = new Map<string, string>();

const SYNCLAN_SHIKI_TOKENIZER: Tokenizer = {
  ...ShikiTokenizer,
  defaultLanguage: 'text',
  defaultTheme: 'one-dark-pro',
  $tokenize(codeNode, language) {
    const children = codeNode.getChildren();
    // Sent messages already contain styled tokens. Reuse them in readonly
    // editors instead of rerunning Shiki and allocating a second token tree.
    if (
      !$getEditor().isEditable() &&
      children.some(
        (node) => $isCodeHighlightNode(node) && node.getStyle() !== '',
      ) &&
      children.every(
        (node) =>
          $isCodeHighlightNode(node) ||
          $isLineBreakNode(node) ||
          $isTabNode(node),
      )
    ) {
      const theme = codeNode.getTheme() || this.defaultTheme;
      let style = codeNode.getStyle() || codeThemeStyles.get(theme);
      if (style === undefined) {
        // Older messages retain token colors but may omit the block background.
        // An empty plaintext block resolves theme colors without parsing the code.
        const probe = $createCodeNode('text').setTheme(theme);
        ShikiTokenizer.$tokenize.call(this, probe, 'text');
        style = probe.getStyle();
        if (codeThemeStyles.size >= 32) codeThemeStyles.clear();
        codeThemeStyles.set(theme, style);
      }
      if (codeNode.getStyle() !== style) codeNode.setStyle(style);
      return children;
    }
    const nodes = ShikiTokenizer.$tokenize.call(this, codeNode, language);
    if (codeThemeStyles.size >= 32) codeThemeStyles.clear();
    codeThemeStyles.set(
      codeNode.getTheme() || this.defaultTheme,
      codeNode.getStyle(),
    );
    return nodes;
  },
};

export const CodeHighlightExtension = /* @__PURE__ */ defineExtension({
  dependencies: [
    /* @__PURE__ */ configExtension(CodeShikiExtension, {
      tokenizer: SYNCLAN_SHIKI_TOKENIZER,
    }),
    /* @__PURE__ */ configExtension(CodeIndentExtension, {
      escapeWithArrows: true,
      tabSize: 2,
    }),
  ],
  name: 'synclan-editor/code-highlight',
});

export function CodeHighlightShikiPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerCodeHighlighting(editor, SYNCLAN_SHIKI_TOKENIZER);
  }, [editor]);

  return null;
}
