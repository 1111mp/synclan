import { useEffect, type JSX } from 'react';
import {
  $addUpdateTag,
  $findMatchingParent,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  isModifierMatch,
  KEY_DOWN_COMMAND,
  SKIP_SELECTION_FOCUS_TAG,
  type LexicalEditor,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { IS_APPLE } from '@lexical/utils';
import { $isLinkNode } from '@lexical/link';
import {
  $createCodePlusNode,
  $isSimpleListItemNode,
  $isSimpleListNode,
  $isSimpleQuoteNode,
} from '../nodes';
import {
  $findNearestListNode,
  $toggleButtletedList,
  $toggleOrderedList,
  $toggleQuoteNode,
  $getSelectedNode,
  $selectionContainsOnlyText,
  $findNearestCodeNode,
  $selectionJustContainsSameCodeNode,
  $toggleCodeNode,
  $splitNodesFromOneLine,
  $copyCompleteNodeWithChildren,
} from './lib';
import {
  SHORTCUT_LINK_CREATE_COMMAND,
  TOGGLE_LINK_CREATE_COMMAND,
} from './link-plugin';

const CONTROL_OR_META = { ctrlKey: !IS_APPLE, metaKey: IS_APPLE };

function isFormatBulletList(event: KeyboardEvent): boolean {
  const { code } = event;
  return (
    (code === 'Numpad8' || code === 'Digit8') &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  );
}

function isFormatNumberedList(event: KeyboardEvent): boolean {
  const { code } = event;
  return (
    (code === 'Numpad7' || code === 'Digit7') &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  );
}

function isFormatCode(event: KeyboardEvent): boolean {
  const { code } = event;
  return (
    code === 'KeyC' &&
    isModifierMatch(event, { ...CONTROL_OR_META, altKey: true })
  );
}

function isFormatQuote(event: KeyboardEvent): boolean {
  const { code } = event;
  return (
    code === 'Period' &&
    isModifierMatch(event, {
      ...CONTROL_OR_META,
      shiftKey: true,
    })
  );
}

function isStrikeThrough(event: KeyboardEvent): boolean {
  const { code } = event;
  return (
    code === 'KeyX' &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  );
}

function isInsertLink(event: KeyboardEvent): boolean {
  const { code } = event;
  return (
    code === 'KeyU' &&
    isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true })
  );
}

function formatNumberedList(editor: LexicalEditor) {
  editor.update(() => {
    $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);

    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const node = $getSelectedNode(selection);
    if ($findNearestCodeNode(node)) return;

    const topNode = node.getTopLevelElement();
    const listNode =
      $findNearestListNode(node) ?? $findNearestListNode(topNode);

    $toggleOrderedList(selection, listNode?.getListType() === 'number');
  });
}

function formatBulletList(editor: LexicalEditor) {
  editor.update(() => {
    $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);

    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const node = $getSelectedNode(selection);
    if ($findNearestCodeNode(node)) return;

    const topNode = node.getTopLevelElement();
    const listNode =
      $findNearestListNode(node) ?? $findNearestListNode(topNode);

    $toggleButtletedList(selection, listNode?.getListType() === 'bullet');
  });
}

function formatQuote(editor: LexicalEditor) {
  editor.update(() => {
    $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);

    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const node = $getSelectedNode(selection);
    if ($findNearestCodeNode(node)) return;

    const topNode = node.getTopLevelElement();
    $toggleQuoteNode(
      selection,
      $isSimpleQuoteNode(topNode) || $isSimpleQuoteNode(node),
    );
  });
}

function formatCode(editor: LexicalEditor) {
  editor.update(() => {
    $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);

    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    if (selection.isCollapsed()) {
      const anchorNode = selection.anchor.getNode();
      if ($findNearestCodeNode(anchorNode)) {
        $toggleCodeNode(selection, true);
        return;
      }

      const anchorParent = $findMatchingParent(anchorNode, (node) => {
        return (
          $isParagraphNode(node) ||
          $isSimpleListItemNode(node) ||
          $isSimpleListNode(node) ||
          $isSimpleQuoteNode(node)
        );
      });

      if (anchorParent === null) return;

      const topNode = anchorNode.getTopLevelElementOrThrow(),
        { leftNodes, rightNodes } = $splitNodesFromOneLine(
          anchorParent?.getChildren(),
          anchorNode,
          selection.anchor.offset,
        );

      anchorParent.clear();
      anchorParent.append(...leftNodes);

      const codeNode = $createCodePlusNode();
      topNode.insertAfter(codeNode);

      const nextNode = $copyCompleteNodeWithChildren(anchorParent, rightNodes);
      if (nextNode) {
        codeNode.insertAfter(nextNode);
      }

      codeNode.selectStart();

      return;
    }

    if (
      selection.getTextContent() === '' ||
      !$selectionContainsOnlyText(selection)
    )
      return;

    const isCode = $selectionJustContainsSameCodeNode(selection);
    $toggleCodeNode(selection, isCode);
  });
}

function formatLink(editor: LexicalEditor) {
  editor.update(() => {
    $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);

    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    if (selection.isCollapsed()) {
      if ($findNearestCodeNode(selection.anchor.getNode())) return;

      editor.dispatchCommand(SHORTCUT_LINK_CREATE_COMMAND, undefined);
    } else {
      const node = $getSelectedNode(selection);
      // `CodePlusNode` should be ignored
      if ($findNearestCodeNode(selection.anchor.getNode())) return;

      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        editor.dispatchCommand(TOGGLE_LINK_CREATE_COMMAND, null);
      } else {
        editor.dispatchCommand(TOGGLE_LINK_CREATE_COMMAND, '');
      }
    }
  });
}

function ShortcutsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const keyboardShortcutsHandler = (event: KeyboardEvent) => {
      // Short-circuit, a least one modifier must be set
      if (isModifierMatch(event, {})) {
        return false;
      } else if (isFormatBulletList(event)) {
        formatBulletList(editor);
      } else if (isFormatNumberedList(event)) {
        formatNumberedList(editor);
      } else if (isFormatCode(event)) {
        formatCode(editor);
      } else if (isFormatQuote(event)) {
        formatQuote(editor);
      } else if (isStrikeThrough(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
      } else if (isInsertLink(event)) {
        formatLink(editor);
      } else {
        // No match for any of the event handlers
        return false;
      }

      event.preventDefault();
      return true;
    };

    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      keyboardShortcutsHandler,
      COMMAND_PRIORITY_NORMAL,
    );
  }, [editor]);

  return null;
}

export {
  ShortcutsPlugin,
  isFormatBulletList,
  isFormatNumberedList,
  isFormatCode,
  isFormatQuote,
  isStrikeThrough,
  isInsertLink,
};
