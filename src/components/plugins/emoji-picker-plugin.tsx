import { useMemo, useState } from 'react';
import {
  $createLineBreakNode,
  $getSelection,
  $isRangeSelection,
  type TextNode,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { FloatingPortal, offset, useFloating } from '@floating-ui/react';

import { search } from '../emoji/lib';
import { $createEmojiNode, Emoji } from '../emoji';
import { cn } from '@/lib/utils';

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

  const { refs, floatingStyles } = useFloating({
    placement: 'top-start',
    middleware: [offset(10)],
  });

  const options = useMemo(() => {
    if (!queryString) return [];

    const emojis = search(queryString, 10);

    return emojis.map((emoji) => new EmojiOption(emoji.short_name));
  }, [queryString]);

  const onSelectOption = (
    selectedOption: EmojiOption,
    nodeToRemove: TextNode | null,
    closeMenu: () => void,
  ) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || selectedOption == null) return;

      if (nodeToRemove) {
        nodeToRemove.remove();
      }

      selection.insertNodes([$createEmojiNode(selectedOption.shortName)]);

      closeMenu();
    });
  };

  return (
    <LexicalTypeaheadMenuPlugin
      options={options}
      onSelectOption={onSelectOption}
      onQueryChange={setQueryString}
      triggerFn={checkForTriggerMatch}
      onOpen={(r) => {
        refs.setPositionReference({
          getBoundingClientRect: r.getRect,
        });
        // eslint-disable-next-line react-compiler/react-compiler
        editor.__emojiMenuOpen = true;
      }}
      onClose={() => {
        editor.__emojiMenuOpen = false;
      }}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (!anchorElementRef.current || !options.length) return null;

        return (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
              className='min-w-52 py-2 rounded-lg bg-popover shadow-lg'
              style={floatingStyles}
            >
              <ul className='max-h-56 overflow-y-auto no-scrollbar'>
                {options.map((emoji, index) => {
                  const isSelected = selectedIndex === index;
                  return (
                    <li
                      key={emoji.shortName}
                      className={cn(
                        'flex px-3 py-1 space-x-2 items-center cursor-pointer',
                        isSelected && 'bg-gray-05 dark:bg-gray-60/30',
                      )}
                      role='option'
                      tabIndex={-1}
                      aria-selected={isSelected}
                      ref={(el) => {
                        if (isSelected && el) {
                          el.scrollIntoView({ block: 'nearest' });
                        }
                      }}
                      onMouseEnter={() => {
                        setHighlightedIndex(index);
                      }}
                      onClick={() => {
                        setHighlightedIndex(index);
                        selectOptionAndCleanUp(emoji);
                      }}
                    >
                      <Emoji shortName={emoji.shortName} size={24} />
                      <span>{emoji.shortName}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </FloatingPortal>
        );
      }}
    />
  );
}

export { EmojiPickerPlugin };
