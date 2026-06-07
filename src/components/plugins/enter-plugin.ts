import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ENTER_COMMAND,
} from 'lexical';
import {
  CAN_USE_BEFORE_INPUT,
  IS_APPLE_WEBKIT,
  IS_IOS,
  IS_SAFARI,
} from './lib';

type EnterPluginProps = {
  onSend?: () => void;
};

function EnterPlugin({ onSend }: EnterPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<KeyboardEvent | null>(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        if (editor.__emojiMenuOpen) return false;

        if (event !== null) {
          // If we have beforeinput, then we can avoid blocking
          // the default behavior. This ensures that the iOS can
          // intercept that we're actually inserting a paragraph,
          // and autocomplete, autocapitalize etc work as intended.
          // This can also cause a strange performance issue in
          // Safari, where there is a noticeable pause due to
          // preventing the key down of enter.
          if (
            (IS_IOS || IS_SAFARI || IS_APPLE_WEBKIT) &&
            CAN_USE_BEFORE_INPUT
          ) {
            return false;
          }

          event.preventDefault();

          if (event.shiftKey) {
            return editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
          }

          onSend?.();
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, onSend]);

  return null;
}

export { EnterPlugin };
