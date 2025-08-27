import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { search } from '../emoji/lib';
import type { TextNode } from 'lexical';
import { Emoji } from '../emoji';

class EmojiOption extends MenuOption {
  shortName: string;

  constructor(shortName: string) {
    super(shortName);
    this.shortName = shortName;
  }
}

function EmojiPickerPlugin() {
  const [queryString, setQueryString] = useState<string | null>(null);

  const [editor] = useLexicalComposerContext();

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch(':', {
    minLength: 0,
    punctuation: '\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\[\\]\\\\/!%\'"~=<>:;', // allow _ and -
  });

  const options = useMemo(() => {
    if (!queryString) return [];

    const emojis = search(queryString, 10);
    console.log('showEmojiResults', emojis);

    return emojis.map((emoji) => new EmojiOption(emoji.short_name));
  }, [queryString]);

  const onSelectOption = (
    selectedOption: EmojiOption,
    nodeToRemove: TextNode | null,
    closeMenu: () => void,
  ) => {};

  return (
    <LexicalTypeaheadMenuPlugin
      options={options}
      onSelectOption={onSelectOption}
      onQueryChange={setQueryString}
      triggerFn={checkForTriggerMatch}
      menuRenderFn={(
        anchorElementRef,
        // { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (anchorElementRef.current == null || options.length === 0) {
          return null;
        }

        return anchorElementRef.current && options.length
          ? createPortal(
              <div>
                <ul>
                  {options.map((emoji) => (
                    <Emoji shortName={emoji.shortName} />
                  ))}
                </ul>
              </div>,
              anchorElementRef.current,
            )
          : null;
      }}
    />
  );
}

export { EmojiPickerPlugin };
