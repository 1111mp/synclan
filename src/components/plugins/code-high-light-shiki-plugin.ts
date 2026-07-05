/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CodeIndentExtension } from '@lexical/code-core';
import {
  CodeShikiExtension,
  registerCodeHighlighting,
  ShikiTokenizer,
} from '@lexical/code-shiki';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { configExtension, defineExtension } from 'lexical';
import { useEffect, type JSX } from 'react';

const NULL_LANG_SHIKI_TOKENIZER = {
  ...ShikiTokenizer,
  defaultLanguage: 'text',
  defaultTheme: 'one-dark-pro',
};

/**
 * Playground aggregator that switches between {@link CodePrismExtension}
 * and {@link CodeShikiExtension} based on a `mode` signal. Both sub-
 * extensions start in `disabled: true` state and this extension flips
 * their `disabled` signals to route highlighting to the selected engine.
 */
export const CodeHighlightExtension = /* @__PURE__ */ defineExtension({
  dependencies: [
    /* @__PURE__ */ configExtension(CodeShikiExtension, {
      tokenizer: NULL_LANG_SHIKI_TOKENIZER,
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
    return registerCodeHighlighting(editor, {
      ...ShikiTokenizer,
      defaultLanguage: 'text',
      defaultTheme: 'one-dark-pro',
    });
  }, [editor]);

  return null;
}
