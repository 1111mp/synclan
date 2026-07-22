import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { BLUR_COMMAND, COMMAND_PRIORITY_LOW, FOCUS_COMMAND } from 'lexical';
import { useEffect, useRef } from 'react';

type IsFocusedPluginProps = {
  onFocusChange?: (focus: boolean) => void;
};

function IsFocusedPlugin({ onFocusChange }: IsFocusedPluginProps) {
  const [editor] = useLexicalComposerContext();

  const onChangeRef = useRef<IsFocusedPluginProps['onFocusChange']>(null);
  onChangeRef.current = onFocusChange;

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          onChangeRef.current?.(true);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          onChangeRef.current?.(false);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
}

export { IsFocusedPlugin, type IsFocusedPluginProps };
