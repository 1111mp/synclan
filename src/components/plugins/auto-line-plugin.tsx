import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';

type AutoLinePluginProps = {
  onLineChange?: (changed: boolean) => void;
};

function AutoLinePlugin({ onLineChange }: AutoLinePluginProps) {
  const [editor] = useLexicalComposerContext();
  const rootInitialSizeRef = useRef<{ width: number; height: number } | null>(
    null,
  );

  const onLineChangeRef = useRef<AutoLinePluginProps['onLineChange']>(void 0);
  onLineChangeRef.current = onLineChange;

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (rootElement) {
      const rect = rootElement.getBoundingClientRect();
      rootInitialSizeRef.current = {
        width: rect.width,
        height: rect.height,
      };
    }

    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        newEditor.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          const rootElement = editor.getRootElement();
          if (!rootElement) return false;

          const domSelection = window.getSelection();
          if (!domSelection || domSelection.rangeCount === 0) return false;

          const range = domSelection.getRangeAt(0);
          if (!range.collapsed) return false;

          const rootRect = rootElement.getBoundingClientRect();

          if (
            rootInitialSizeRef.current &&
            rootRect.height > rootInitialSizeRef.current.height
          ) {
            onLineChangeRef.current?.(true);
          }

          const selectionRect = range.getBoundingClientRect();
          const left = selectionRect.left - rootRect.left;
          if (
            rootInitialSizeRef.current &&
            rootRect.height <= rootInitialSizeRef.current.height &&
            left < rootInitialSizeRef.current.width
          ) {
            onLineChangeRef.current?.(false);
          }
        });

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}

export { AutoLinePlugin, type AutoLinePluginProps };
