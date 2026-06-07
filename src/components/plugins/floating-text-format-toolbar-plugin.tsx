import { useCallback, useEffect, useState, type JSX } from 'react';
import {
  $createParagraphNode,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  getDOMSelection,
  SELECTION_CHANGE_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { Button } from '../ui';
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
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isCodeHighlightNode } from '@lexical/code';
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { mergeRegister } from '@lexical/utils';
import {
  $createNestedListWithDepth,
  $getTopListNode,
  $setBlocksTypeWith,
  getSelectedNode,
} from './lib';
import { cn } from '@/lib/utils';
import { $copyBlockFormatIndent, $setBlocksType } from '@lexical/selection';
import { $createQuoteNode, $isQuoteNode } from '@lexical/rich-text';
import {
  $isListItemNode,
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  ListNode,
} from '@lexical/list';

function formatParagraph(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection();
    $setBlocksType(selection, () => $createParagraphNode());
  });
}

function findNearestListNode(node: LexicalNode | null): ListNode | null {
  if (!node) return null;

  if ($isListNode(node)) return node;

  if ($isListItemNode(node)) {
    const parent = node.getParent();
    return $isListNode(parent) ? parent : null;
  }

  const parent = node.getParent();
  if ($isListItemNode(parent)) {
    const listNode = parent.getParent();
    return $isListNode(listNode) ? listNode : null;
  }

  return null;
}

function TextFormatFloatingToolbar({
  editor,
  isBold,
  isStrikethrough,
  isItalic,
  isUnderline,
  isOrderedList,
  isBulletList,
  isQuota,
}: {
  editor: LexicalEditor;
  isBold: boolean;
  isStrikethrough: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isOrderedList: boolean;
  isBulletList: boolean;
  isQuota: boolean;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top-start',
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const $updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection();
    const nativeSelection = getDOMSelection(editor._window);
    const rootElement = editor.getRootElement();

    if (
      $isRangeSelection(selection) &&
      !selection.isCollapsed() &&
      nativeSelection !== null &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const node = getSelectedNode(selection);
      const topNode = node.getTopLevelElementOrThrow();
      const element = editor.getElementByKey(topNode.getKey());

      refs.setReference(element);
      setIsOpen(true);
    }
  }, [editor]);

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
    );
  }, [editor, $updateTextFormatFloatingToolbar]);

  if (!isOpen) return null;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        className='flex items-center p-2 rounded-md border bg-popover text-popover-foreground'
        style={floatingStyles}
      >
        <Button
          className={cn(
            'transition-colors duration-300',
            isBold &&
              'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
          )}
          variant='ghost'
          size='xs'
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          }}
        >
          <Bold />
        </Button>
        <Button
          className={cn(
            'transition-colors duration-300',
            isStrikethrough &&
              'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
          )}
          variant='ghost'
          size='xs'
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
          }}
        >
          <Strikethrough />
        </Button>
        <Button
          className={cn(
            'transition-colors duration-300',
            isItalic &&
              'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
          )}
          variant='ghost'
          size='xs'
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          }}
        >
          <Italic />
        </Button>
        <Button
          className={cn(
            'transition-colors duration-300',
            isUnderline &&
              'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
          )}
          variant='ghost'
          size='xs'
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          }}
        >
          <Underline />
        </Button>
        <Button
          className={cn(
            'transition-colors duration-300',
            isOrderedList &&
              'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
          )}
          variant='ghost'
          size='xs'
          onClick={() => {
            if (!isOrderedList) {
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            } else {
              formatParagraph(editor);
            }
          }}
        >
          <ListOrdered />
        </Button>
        <Button
          className={cn(
            'transition-colors duration-300',
            isBulletList &&
              'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
          )}
          variant='ghost'
          size='xs'
          onClick={() => {
            editor.update(() => {
              const selection = $getSelection();
              if (!$isRangeSelection(selection)) return;

              if (!isBulletList) {
                $setBlocksTypeWith(selection, (preNode) => {
                  if ($isListItemNode(preNode)) {
                    const parent = preNode.getParent<ListNode>();
                    parent?.setListType('bullet');
                    return null;
                  }

                  const preTopNode = preNode.getTopLevelElementOrThrow();
                  if ($isQuoteNode(preTopNode)) {
                    console.log(preTopNode.getChildren());
                    const { outerListNode, innerListItemNode } =
                      $createNestedListWithDepth('bullet', 0);
                    innerListItemNode.append(...preTopNode.getChildren());
                    preTopNode.append(outerListNode);
                    return preTopNode;
                  }

                  const { outerListNode, innerListItemNode } =
                    $createNestedListWithDepth('bullet', 0);
                  innerListItemNode.append(...preTopNode.getChildren());
                  preTopNode.replace(outerListNode);
                  return outerListNode;
                });
              } else {
                $setBlocksTypeWith(selection, (preNode) => {
                  if (!$isListItemNode(preNode)) return null;

                  const preTopNode = preNode.getTopLevelElementOrThrow();
                  if (!$isListNode(preTopNode)) {
                    const topListNode = $getTopListNode(preNode);
                    preTopNode.append(...preNode.getChildren());
                    topListNode.remove();
                    return preTopNode;
                  } else {
                    const paragraph = $createParagraphNode();
                    paragraph.append(...preNode.getChildren());
                    preTopNode.insertBefore(paragraph);
                    preTopNode.remove();
                    return paragraph;
                  }
                });
              }
            });
          }}
        >
          <List />
        </Button>
        <Button
          className={cn(
            'transition-colors duration-300',
            isQuota &&
              'bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500',
          )}
          variant='ghost'
          size='xs'
          onClick={() => {
            editor.update(() => {
              const selection = $getSelection();
              if (!$isRangeSelection(selection)) return;

              if (!isQuota) {
                $setBlocksTypeWith(selection, (preNode) => {
                  const preTopNode = preNode.getTopLevelElementOrThrow();
                  if ($isQuoteNode(preTopNode)) return null;

                  if ($isListItemNode(preNode) || $isListNode(preTopNode)) {
                    const quoteNode = $createQuoteNode();
                    preTopNode.insertBefore(quoteNode);
                    quoteNode.append(preTopNode);
                    return quoteNode;
                  }

                  const quoteNode = $createQuoteNode();
                  $copyBlockFormatIndent(preTopNode, quoteNode);
                  preTopNode.replace(quoteNode, true);
                  return quoteNode;
                });
              } else {
                $setBlocksTypeWith(selection, (preNode) => {
                  const preTopNode = preNode.getTopLevelElementOrThrow();
                  if (!$isQuoteNode(preTopNode)) return null;

                  if ($isListItemNode(preNode)) {
                    const listNode = $getTopListNode(preNode);
                    preTopNode.replace(listNode);
                    return listNode;
                  }

                  const paragraph = $createParagraphNode();
                  $copyBlockFormatIndent(preTopNode, paragraph);
                  preTopNode.replace(paragraph, true);
                  return paragraph;
                });
              }
            });
          }}
        >
          <Quote />
        </Button>
        <Button variant='ghost' size='xs'>
          <Link />
        </Button>
        <Button variant='ghost' size='xs'>
          <Braces />
        </Button>
      </div>
    </FloatingPortal>
  );
}

function FloatingTextFormatToolbarPlugin(): JSX.Element | null {
  const [isText, setIsText] = useState<boolean>(false);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isStrikethrough, setIsStrikethrough] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [isOrderedList, setIsOrderedList] = useState<boolean>(false);
  const [isBulletList, setIsBulletList] = useState<boolean>(false);
  const [isQuote, setIsQuote] = useState<boolean>(false);

  const [editor] = useLexicalComposerContext();

  const updatePopup = useCallback(() => {
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

      const node = getSelectedNode(selection);
      const anchorNode = selection.anchor.getNode();

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      const topNode = node.getTopLevelElementOrThrow();

      // Update quote
      if ($isQuoteNode(topNode) || $isQuoteNode(node)) {
        setIsQuote(true);
      } else {
        setIsQuote(false);
      }

      // Update ordered & bullet list
      const listNode =
        findNearestListNode(topNode) ?? findNearestListNode(node);
      if (listNode) {
        const type = listNode.getListType();
        setIsOrderedList(type === 'number');
        setIsBulletList(type === 'bullet');
      } else {
        setIsOrderedList(false);
        setIsBulletList(false);
      }

      // Update links

      if (
        !$isCodeHighlightNode(anchorNode) &&
        selection.getTextContent() !== ''
      ) {
        setIsText(
          $isTextNode(node) || $isParagraphNode(node) || $isListItemNode(node),
        );
      } else {
        setIsText(false);
      }

      const rawTextContent = selection.getTextContent().replace(/\n/g, '');
      if (!selection.isCollapsed() && rawTextContent === '') {
        setIsText(false);
        return;
      }
    });
  }, [editor]);

  useEffect(() => {
    document.addEventListener('selectionchange', updatePopup);
    return () => {
      document.removeEventListener('selectionchange', updatePopup);
    };
  }, [updatePopup]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup();
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false);
        }
      }),
    );
  }, [editor, updatePopup]);

  console.log('isText', isText);

  if (!isText) return null;

  return (
    <TextFormatFloatingToolbar
      editor={editor}
      isBold={isBold}
      isStrikethrough={isStrikethrough}
      isItalic={isItalic}
      isUnderline={isUnderline}
      isOrderedList={isOrderedList}
      isBulletList={isBulletList}
      isQuota={isQuote}
    />
  );
}

export { FloatingTextFormatToolbarPlugin };
