import {
  autoUpdate,
  flip,
  FloatingPortal,
  inline,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStyles,
} from '@floating-ui/react';
import { $isLinkNode } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $addUpdateTag,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  getDOMSelection,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  SKIP_SELECTION_FOCUS_TAG,
  type LexicalEditor,
} from 'lexical';
import {
  Bold,
  Braces,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type JSX,
} from 'react';

import { cn } from '@/lib/utils';

import { $isSimpleListItemNode, $isSimpleQuoteNode } from '../nodes';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '../ui';
import {
  $findNearestCodeNode,
  $findNearestListNode,
  $getSelectedNode,
  $selectionContainsOnlyText,
  $selectionJustContainsSameCodeNode,
  $toggleButtletedList,
  $toggleCodeNode,
  $toggleOrderedList,
  $toggleQuoteNode,
} from './lib';
import {
  SHORTCUT_LINK_CREATE_COMMAND,
  TOGGLE_LINK_CREATE_COMMAND,
} from './link-plugin';

const OFFSET_X = 12;

type TextFormatFloatingToolbarProps = {
  isText?: boolean;
  editor: LexicalEditor;
  isBold: boolean;
  isStrikethrough: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isOrderedList: boolean;
  isBulletList: boolean;
  isQuote: boolean;
  isLink: boolean;
  isCode: boolean;
  isOnlyText: boolean;
  onSetIsLinkEditMode: Dispatch<boolean>;
};

function TextFormatToolbar({
  editor,
  isBold,
  isStrikethrough,
  isItalic,
  isUnderline,
  isOrderedList,
  isBulletList,
  isQuote,
  isLink,
  isCode,
  isOnlyText,
  onSetIsLinkEditMode,
}: Omit<TextFormatFloatingToolbarProps, 'isText'>) {
  return (
    <div className='flex items-center space-x-1 p-2'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              'transition-colors duration-300',
              isBold &&
                'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
            )}
            disabled={isCode}
            variant='ghost'
            size='sm'
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
            }}
          >
            <Bold />
          </Button>
        </TooltipTrigger>
        <TooltipContent className='flex flex-col'>
          <p>粗体（&#x2318;B）</p>
          <p>Markdown：**文字** 空格</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              'transition-colors duration-300',
              isStrikethrough &&
                'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
            )}
            disabled={isCode}
            variant='ghost'
            size='sm'
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
            }}
          >
            <Strikethrough />
          </Button>
        </TooltipTrigger>
        <TooltipContent className='flex flex-col'>
          <p>删除线（&#x2318;+Shift+X）</p>
          <p>Markdown：~~文字~~ 空格</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              'transition-colors duration-300',
              isItalic &&
                'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
            )}
            disabled={isCode}
            variant='ghost'
            size='sm'
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
            }}
          >
            <Italic />
          </Button>
        </TooltipTrigger>
        <TooltipContent className='flex flex-col'>
          <p>斜体（&#x2318;I）</p>
          <p>Markdown：*文字* 空格</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              'transition-colors duration-300',
              isUnderline &&
                'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
            )}
            disabled={isCode}
            variant='ghost'
            size='sm'
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
            }}
          >
            <Underline />
          </Button>
        </TooltipTrigger>
        <TooltipContent className='flex flex-col'>
          <p>下划线（&#x2318;U）</p>
          <p>Markdown：~文字~ 空格</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              'transition-colors duration-300',
              !isCode &&
                isOrderedList &&
                'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
            )}
            disabled={isCode}
            variant='ghost'
            size='sm'
            onClick={() => {
              editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                $toggleOrderedList(selection, isOrderedList);
              });
            }}
          >
            <ListOrdered />
          </Button>
        </TooltipTrigger>
        <TooltipContent className='flex flex-col'>
          <p>有序列表（&#x2318;+Shift+7）</p>
          <p>Markdown：1. 空格</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              'transition-colors duration-300',
              !isCode &&
                isBulletList &&
                'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
            )}
            disabled={isCode}
            variant='ghost'
            size='sm'
            onClick={() => {
              editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                $toggleButtletedList(selection, isBulletList);
              });
            }}
          >
            <List />
          </Button>
        </TooltipTrigger>
        <TooltipContent className='flex flex-col'>
          <p>无序列表（&#x2318;+Shift+8）</p>
          <p>Markdown：- 空格</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              'transition-colors duration-300',
              !isCode &&
                isQuote &&
                'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
            )}
            disabled={isCode}
            variant='ghost'
            size='sm'
            onClick={() => {
              editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                $toggleQuoteNode(selection, isQuote);
              });
            }}
          >
            <Quote />
          </Button>
        </TooltipTrigger>
        <TooltipContent className='flex flex-col'>
          <p>引用（&#x2318;+Shift+&gt;）</p>
          <p>Markdown：&gt; 空格</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              'transition-colors duration-300',
              !isCode &&
                isLink &&
                'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
            )}
            disabled={isCode}
            variant='ghost'
            size='sm'
            onClick={() => {
              editor.update(() => {
                $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);

                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                if (selection.isCollapsed()) {
                  if ($findNearestCodeNode(selection.anchor.getNode())) return;

                  editor.dispatchCommand(
                    SHORTCUT_LINK_CREATE_COMMAND,
                    undefined,
                  );
                } else {
                  if (!isLink) {
                    onSetIsLinkEditMode(true);
                    editor.dispatchCommand(TOGGLE_LINK_CREATE_COMMAND, '');
                  } else {
                    onSetIsLinkEditMode(false);
                    editor.dispatchCommand(TOGGLE_LINK_CREATE_COMMAND, null);
                  }
                }
              });
            }}
          >
            <Link />
          </Button>
        </TooltipTrigger>
        <TooltipContent className='flex flex-col'>
          <p>链接（&#x2318;+Shift+U）</p>
          <p>Markdown：[文字](链接) 空格</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className={cn(
              'disabled:pointer-events-auto',
              isCode &&
                'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
            )}
            disabled={
              !isCode &&
              (!isOnlyText ||
                isOrderedList ||
                isBulletList ||
                isQuote ||
                isLink)
            }
            onClick={() => {
              editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                $toggleCodeNode(selection, isCode);
              });
            }}
          >
            <Braces />
          </Button>
        </TooltipTrigger>
        <TooltipContent className='flex flex-col'>
          <p>代码块（&#x2318;+&#x2325;+C）</p>
          <p>Markdown：``` 空格 或 ```代码语言 空格</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function TextFormatFloatingToolbar({
  isText = false,
  editor,
  isBold,
  isStrikethrough,
  isItalic,
  isUnderline,
  isOrderedList,
  isBulletList,
  isQuote,
  isLink,
  isCode,
  isOnlyText,
  onSetIsLinkEditMode,
}: TextFormatFloatingToolbarProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const isMouseDown = useRef<boolean>(false);
  const isReady = useRef<boolean>(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open, event) => {
      if (!editor.getRootElement()?.contains((event?.target as Node) ?? null)) {
        editor.blur();
      }
      setIsOpen(open);
    },
    placement: 'top-start',
    middleware: [offset(10), inline(), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context, {
    escapeKey: false,
    outsidePress: true,
  });
  const { getFloatingProps } = useInteractions([dismiss]);

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    initial: {
      opacity: 0,
      transform: 'translateY(6px)',
    },
    open: {
      opacity: 1,
      transform: 'translateY(0px)',
    },
    duration: {
      open: 180,
      close: 0,
    },
  });

  const $updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection();
    const nativeSelection = getDOMSelection(editor._window);
    const rootElement = editor.getRootElement();

    // We need to set `false` every times
    isReady.current = false;

    if (
      $isRangeSelection(selection) &&
      !selection.isCollapsed() &&
      nativeSelection !== null &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode) &&
      nativeSelection.rangeCount > 0
    ) {
      const range = nativeSelection.getRangeAt(0);
      const rootWrapper = document.getElementById(
        'synclan-composition-scroll-wrapper',
      )!;

      refs.setPositionReference({
        getBoundingClientRect: () => {
          const rangeRect = range.getBoundingClientRect();
          const rootWrapperRect = rootWrapper.getBoundingClientRect();
          const isOutOfRootWrapper = rangeRect.top < rootWrapperRect.top;

          if (isOutOfRootWrapper) {
            const { x, y, top, bottom, left, right, width, height } =
              rootWrapperRect;
            return {
              x: x + OFFSET_X,
              y,
              top,
              bottom,
              left: left + OFFSET_X,
              right: right + OFFSET_X,
              width,
              height,
            };
          }
          return range.getBoundingClientRect();
        },
        getClientRects: () => {
          const rangeRect = range.getBoundingClientRect();
          const rootWrapperRect = rootWrapper.getBoundingClientRect();
          const isOutOfRootWrapper = rangeRect.top < rootWrapperRect.top;

          if (isOutOfRootWrapper) {
            const { x, y, top, bottom, left, right, width, height } =
              rootWrapperRect;
            return [
              {
                x: x + OFFSET_X,
                y,
                top,
                bottom,
                left: left + OFFSET_X,
                right: right + OFFSET_X,
                width,
                height,
              },
            ];
          }
          return range.getClientRects();
        },
      });

      if (!isMouseDown.current) {
        setIsOpen(true);
      } else {
        isReady.current = true;
      }
    }
  }, [editor, refs]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateTextFormatFloatingToolbar();
    });
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateTextFormatFloatingToolbar();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateTextFormatFloatingToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),

      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        (event) => {
          if (isOpen) {
            event.preventDefault();
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [editor, isOpen, $updateTextFormatFloatingToolbar]);

  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;

    const handleMouseDown = () => {
      isMouseDown.current = true;
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
      setTimeout(() => {
        if (isReady.current) {
          isReady.current = false;
          setIsOpen(true);
        }
      }, 30);
    };

    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      isMouseDown.current = false;
      isReady.current = false;
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [editor]);

  if (!isText || !isOpen || !isMounted) return null;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        className='bg-popover text-popover-foreground rounded-md border'
        style={{
          ...floatingStyles,
          ...transitionStyles,
          transform: `${floatingStyles.transform ?? ''} ${transitionStyles.transform ?? ''}`,
        }}
        {...getFloatingProps()}
        onMouseDown={(e) => {
          // prevent editor blur
          e.preventDefault();
        }}
      >
        <TextFormatToolbar
          editor={editor}
          isBold={isBold}
          isStrikethrough={isStrikethrough}
          isItalic={isItalic}
          isUnderline={isUnderline}
          isOrderedList={isOrderedList}
          isBulletList={isBulletList}
          isQuote={isQuote}
          isLink={isLink}
          isCode={isCode}
          isOnlyText={isOnlyText}
          onSetIsLinkEditMode={onSetIsLinkEditMode}
        />
      </div>
    </FloatingPortal>
  );
}

function useFormatToolbar(editor: LexicalEditor) {
  const [isText, setIsText] = useState<boolean>(false);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isStrikethrough, setIsStrikethrough] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [isOrderedList, setIsOrderedList] = useState<boolean>(false);
  const [isBulletList, setIsBulletList] = useState<boolean>(false);
  const [isQuote, setIsQuote] = useState<boolean>(false);
  const [isLink, setIsLink] = useState<boolean>(false);
  const [isCode, setIsCode] = useState<boolean>(false);
  const [isOnlyText, setIsOnlyText] = useState<boolean>(false);

  const debounceUpdatePopup = useMemo(
    () => () => {
      editor.getEditorState().read(() => {
        // Should not to pop up the floating toolbar when using IME input
        if (editor.isComposing()) return;

        const selection = $getSelection();
        const nativeSelection = getDOMSelection(editor._window);
        const rootElement = editor.getRootElement();
        if (
          nativeSelection !== null &&
          (!$isRangeSelection(selection) ||
            rootElement === null ||
            !rootElement.contains(nativeSelection.anchorNode))
        ) {
          setIsText(false);
          return;
        }

        if (!$isRangeSelection(selection)) return;

        const node = $getSelectedNode(selection);
        // const anchorNode = selection.anchor.getNode();

        // Update text format
        setIsBold(selection.hasFormat('bold'));
        setIsStrikethrough(selection.hasFormat('strikethrough'));
        setIsItalic(selection.hasFormat('italic'));
        setIsUnderline(selection.hasFormat('underline'));

        const topNode = node.getTopLevelElement();

        // Update quote
        if ($isSimpleQuoteNode(topNode) || $isSimpleQuoteNode(node)) {
          setIsQuote(true);
        } else {
          setIsQuote(false);
        }

        // Update ordered & bullet list
        const listNode =
          $findNearestListNode(node) ?? $findNearestListNode(topNode);
        if (listNode) {
          const type = listNode.getListType();
          setIsOrderedList(type === 'number');
          setIsBulletList(type === 'bullet');
        } else {
          setIsOrderedList(false);
          setIsBulletList(false);
        }

        // Update links
        const parent = node.getParent();
        if ($isLinkNode(parent) || $isLinkNode(node)) {
          setIsLink(true);
        } else {
          setIsLink(false);
        }

        if ($selectionJustContainsSameCodeNode(selection)) {
          setIsCode(true);
        } else {
          setIsCode(false);
        }

        if (selection.getTextContent() !== '') {
          setIsText(
            $isTextNode(node) ||
              $isParagraphNode(node) ||
              $isSimpleListItemNode(node),
          );

          if ($selectionContainsOnlyText(selection)) {
            setIsOnlyText(true);
          } else {
            setIsText(false);
            setIsOnlyText(false);
          }
        } else {
          setIsText(false);
          // maybe we need to check whether it's a `CodeNode`
          setIsOnlyText(true);
        }

        const rawTextContent = selection.getTextContent().replace(/\n/g, '');
        if (!selection.isCollapsed() && rawTextContent === '') {
          setIsText(false);
          return;
        }
      });
    },
    [editor],
  );

  useEffect(() => {
    document.addEventListener('selectionchange', debounceUpdatePopup);
    return () => {
      document.removeEventListener('selectionchange', debounceUpdatePopup);
    };
  }, [debounceUpdatePopup]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        debounceUpdatePopup();
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false);
        }
      }),
    );
  }, [editor, debounceUpdatePopup]);

  return {
    isText,
    isBold,
    isStrikethrough,
    isItalic,
    isUnderline,
    isOrderedList,
    isBulletList,
    isQuote,
    isLink,
    isCode,
    isOnlyText,
  };
}

function FixedTextFormatToolbar({
  onSetIsLinkEditMode,
}: {
  onSetIsLinkEditMode: Dispatch<boolean>;
}) {
  const [editor] = useLexicalComposerContext();

  const {
    isBold,
    isStrikethrough,
    isItalic,
    isUnderline,
    isOrderedList,
    isBulletList,
    isQuote,
    isLink,
    isCode,
    isOnlyText,
  } = useFormatToolbar(editor);

  return (
    <TextFormatToolbar
      editor={editor}
      isBold={isBold}
      isStrikethrough={isStrikethrough}
      isItalic={isItalic}
      isUnderline={isUnderline}
      isOrderedList={isOrderedList}
      isBulletList={isBulletList}
      isQuote={isQuote}
      isLink={isLink}
      isCode={isCode}
      isOnlyText={isOnlyText}
      onSetIsLinkEditMode={onSetIsLinkEditMode}
    />
  );
}

function FloatingTextFormatToolbarPlugin({
  onSetIsLinkEditMode,
}: {
  onSetIsLinkEditMode: Dispatch<boolean>;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  const {
    isText,
    isBold,
    isStrikethrough,
    isItalic,
    isUnderline,
    isOrderedList,
    isBulletList,
    isQuote,
    isLink,
    isCode,
    isOnlyText,
  } = useFormatToolbar(editor);

  return (
    <TextFormatFloatingToolbar
      isText={isText}
      editor={editor}
      isBold={isBold}
      isStrikethrough={isStrikethrough}
      isItalic={isItalic}
      isUnderline={isUnderline}
      isOrderedList={isOrderedList}
      isBulletList={isBulletList}
      isQuote={isQuote}
      isLink={isLink}
      isCode={isCode}
      isOnlyText={isOnlyText}
      onSetIsLinkEditMode={onSetIsLinkEditMode}
    />
  );
}

export { FixedTextFormatToolbar, FloatingTextFormatToolbarPlugin };
