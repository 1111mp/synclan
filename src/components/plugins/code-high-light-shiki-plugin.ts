import { useEffect, type JSX } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerCodeHighlighting, ShikiTokenizer } from '@lexical/code-shiki';

function CodeHighlightShikiPlugin(): JSX.Element | null {
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

export { CodeHighlightShikiPlugin };
