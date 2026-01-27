import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, getDOMSelection } from 'lexical';
import { useLatestRef } from '@/hooks';

type AutoLinePluginProps = {
  onLineChange?: (changed: boolean) => void;
};

function AutoLinePlugin({ onLineChange }: AutoLinePluginProps) {
  const [editor] = useLexicalComposerContext();
  const rootInitialSizeRef = useRef<{ width: number; height: number } | null>(
    null,
  );

  const latestLineChange = useLatestRef(onLineChange);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (rootElement) {
      const rect = rootElement.getBoundingClientRect();
      rootInitialSizeRef.current = {
        width: rect.width,
        height: rect.height,
      };
    }

    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const rootElement = editor.getRootElement();
        if (!rootElement) return false;

        const nativeSelection = getDOMSelection(editor._window);
        if (!nativeSelection || nativeSelection.rangeCount === 0) return false;

        const range = nativeSelection.getRangeAt(0);
        // if (!range.collapsed) return false;

        const rootRect = rootElement.getBoundingClientRect();
        const selectionRect = range.getBoundingClientRect();

        if (
          rootInitialSizeRef.current &&
          (rootRect.height > rootInitialSizeRef.current.height ||
            selectionRect.width > rootInitialSizeRef.current.width)
        ) {
          latestLineChange.current?.(true);
          return false;
        }

        const left = selectionRect.left - rootRect.left;
        if (
          rootInitialSizeRef.current &&
          rootRect.height <= rootInitialSizeRef.current.height &&
          left < rootInitialSizeRef.current.width
        ) {
          latestLineChange.current?.(false);
        }
      });

      return false;
    });
  }, [editor, latestLineChange]);

  return null;
}

export { AutoLinePlugin, type AutoLinePluginProps };
