import { useVirtualizer } from '@tanstack/react-virtual';
import { chunk, debounce, flatMap, initial, last, zipObject } from 'lodash-es';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { Input } from '../ui';
import { Emoji } from './emoji';
import {
  EmojiCategory,
  type Props as EmojiCategoryProps,
} from './emoji-category';
import { dataByCategory, search, skinTonesData } from './lib';

export type EmojiPickDataType = { skinTone?: number; shortName: string };

type EmojiPickerProps = {
  recentEmojis?: string[];
  skinTone?: number;
  disableSkinTones?: boolean;
  doSend?: () => unknown;
  onClose?: () => unknown;
  onPickEmoji?: (o: EmojiPickDataType) => unknown;
  onSetSkinTone?: (tone: number) => unknown;
};

type Category = NonNullable<EmojiCategoryProps['category']>;

const COL_COUNT = 8,
  categories: Array<Category> = [
    'recents',
    'emoji',
    'animal',
    'food',
    'activity',
    'travel',
    'object',
    'symbol',
    'flag',
  ];

function EmojiPicker({
  recentEmojis = [],
  skinTone = 0,
  disableSkinTones = false,
  doSend,
  onClose,
  onPickEmoji,
  onSetSkinTone,
}: EmojiPickerProps) {
  const [firstRecent] = useState<string[]>(recentEmojis);
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    () => categories[0],
  );
  const [searchMode, setSearchMode] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedTone, setSelectedTone] = useState<number>(
    disableSkinTones ? 0 : skinTone,
  );

  const { t } = useTranslation();

  const content = useRef<HTMLDivElement>(null);

  const [, ...renderableCategories] = categories;

  const emojiGrid = useMemo(() => {
    if (searchText) {
      return chunk(
        search(searchText).map((e) => e.short_name),
        COL_COUNT,
      );
    }

    const chunks = flatMap(renderableCategories, (cat) =>
      chunk(
        dataByCategory[cat!].map((e) => e.short_name),
        COL_COUNT,
      ),
    );

    return [...chunk(firstRecent, COL_COUNT), ...chunks];
  }, [firstRecent, renderableCategories, searchText]);

  const catRowEnds = useMemo(() => {
    const rowEnds: Array<number> = [
      Math.ceil(firstRecent.length / COL_COUNT) - 1,
    ];

    renderableCategories.forEach((cat) => {
      rowEnds.push(
        Math.ceil(dataByCategory[cat!].length / COL_COUNT) + last(rowEnds)!,
      );
    });

    return rowEnds;
  }, [firstRecent.length, renderableCategories]);

  const getRowHeight = useCallback(
    (index: number) => {
      if (searchText) {
        return 34;
      }

      if (catRowEnds.includes(index) && index !== last(catRowEnds)) {
        return 44;
      }

      return 34;
    },
    [catRowEnds, searchText],
  );

  const rowVirtualizer = useVirtualizer({
    count: emojiGrid.length,
    getScrollElement: () => content.current,
    estimateSize: getRowHeight,
    overscan: 12,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: COL_COUNT,
    getScrollElement: () => content.current,
    estimateSize: () => 38,
  });

  // Handle escape key
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (searchMode && event.key === 'Escape') {
        setSearchText('');
        setSearchMode(false);
        rowVirtualizer.scrollToIndex(0, { align: 'start' });

        event.preventDefault();
        event.stopPropagation();
      } else if (
        !searchMode &&
        ![
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Shift',
          'Tab',
          ' ', // Space
        ].includes(event.key)
      ) {
        onClose?.();

        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('keydown', handler);

    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [rowVirtualizer, searchMode, onClose]);

  const catToRowOffsets = useMemo(() => {
    const offsets = initial(catRowEnds).map((i) => i + 1);

    return zipObject(categories, [0, ...offsets]);
  }, [catRowEnds]);

  const handleToggleSearch = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSearchText('');
      setSelectedCategory(categories[0]);
      setSearchMode((m) => !m);
    },
    [setSearchText, setSearchMode],
  );

  const handleSelectCategory = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const { category } = e.currentTarget.dataset;
      if (category) {
        setSelectedCategory(category as Category);
        rowVirtualizer.scrollToIndex(catToRowOffsets[category], {
          align: 'start',
        });
      }
    },
    [rowVirtualizer, catToRowOffsets, setSelectedCategory],
  );

  const debounceSearchChange = useMemo(
    () =>
      debounce((query: string) => {
        setSearchText(query);
        rowVirtualizer.scrollToIndex(0, { align: 'start' });
      }, 200),
    [rowVirtualizer, setSearchText],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debounceSearchChange(e.currentTarget.value);
    },
    [debounceSearchChange],
  );

  const handlePickEmoji = useCallback(
    (
      e:
        | React.MouseEvent<HTMLButtonElement>
        | React.KeyboardEvent<HTMLButtonElement>,
    ) => {
      if ('key' in e) {
        if (e.key === 'Enter' && doSend) {
          e.stopPropagation();
          e.preventDefault();
          doSend();
        }
      } else {
        const { shortName } = e.currentTarget.dataset;
        if (shortName) {
          e.stopPropagation();
          e.preventDefault();
          onPickEmoji?.({ skinTone: selectedTone, shortName });
        }
      }
    },
    [doSend, onPickEmoji, selectedTone],
  );

  const handlePickTone = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const { tone = '0' } = e.currentTarget.dataset;
      const parsedTone = parseInt(tone, 10);
      setSelectedTone(parsedTone);
      onSetSkinTone?.(parsedTone);
    },
    [onSetSkinTone],
  );

  return (
    <div className='z-10 grid h-107 w-83 grid-cols-1 grid-rows-[44px_1fr] overflow-hidden rounded-lg select-none'>
      <header className='mx-3 flex h-11 flex-row items-center justify-between'>
        <EmojiCategory
          type='button'
          role='button'
          tabIndex={0}
          aria-label={t('emoji.search')}
          category={searchMode ? 'close' : 'search'}
          onClick={handleToggleSearch}
        />
        {searchMode ? (
          <div className='flex-1 px-2'>
            <Input
              ref={(ref) => {
                ref?.focus();
              }}
              className='h-7'
              placeholder={t('emoji.search')}
              onChange={handleSearchChange}
            />
          </div>
        ) : (
          categories.map((category) => {
            if (category === 'recents' && firstRecent.length === 0) {
              return null;
            }

            return (
              <EmojiCategory
                tabIndex={0}
                role='button'
                type='button'
                title={category}
                key={category}
                category={category}
                data-category={category}
                aria-label={category}
                className={cn(
                  selectedCategory === category &&
                    'bg-gray-05 dark:bg-gray-60/30',
                )}
                onClick={handleSelectCategory}
              />
            );
          })
        )}
      </header>
      <div
        ref={content}
        className='w-full overflow-x-hidden overflow-y-auto px-2 pt-2 pb-0 outline-none'
      >
        {emojiGrid.length ? (
          <div
            className='relative mx-auto'
            style={{
              width: `${columnVirtualizer.getTotalSize()}px`,
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((row) => {
              return (
                <Fragment key={row.key}>
                  {columnVirtualizer.getVirtualItems().map((column) => {
                    const shortName = emojiGrid[row.index][column.index];
                    if (!shortName) return null;

                    return (
                      <div
                        key={column.key}
                        className='hover:bg-gray-05 dark:hover:bg-gray-80 absolute top-0 left-0 flex cursor-pointer items-center justify-center rounded-md'
                        style={{
                          width: `${column.size}px`,
                          height: `${row.size}px`,
                          transform: `translateX(${column.start}px) translateY(${row.start}px)`,
                        }}
                      >
                        <button
                          tabIndex={0}
                          role='button'
                          type='button'
                          title={shortName}
                          data-short-name={shortName}
                          className='emoji-button mouse-mode:outline-none'
                          onClick={handlePickEmoji}
                          onKeyDown={handlePickEmoji}
                        >
                          <Emoji
                            shortName={shortName}
                            skinTone={selectedTone}
                          />
                        </button>
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        ) : (
          <div className='flex items-center justify-center space-x-2'>
            <span>{t('emoji.noEmojiFound')}</span>
            <Emoji shortName='slightly_frowning_face' size={16} />
          </div>
        )}
      </div>
      {!disableSkinTones && (
        <footer className='flex h-11 items-center justify-center'>
          {skinTonesData.map((tone, index) => (
            <button
              key={tone}
              tabIndex={0}
              role='button'
              type='button'
              title={`Skin tone ${tone}`}
              data-tone={index}
              className={cn(
                'emoji-button mouse-mode:outline-none',
                selectedTone === index && 'bg-gray-05 dark:bg-gray-60',
              )}
              onClick={handlePickTone}
            >
              <Emoji shortName='hand' skinTone={index} size={20} />
            </button>
          ))}
        </footer>
      )}
    </div>
  );
}

export { EmojiPicker, type EmojiPickerProps };
