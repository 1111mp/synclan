import { ClipboardDOMImportExtension } from '@lexical/clipboard';
import { CodeHighlightNode, CodeNode } from '@lexical/code-core';
import { AutoFocusExtension, ClearEditorExtension } from '@lexical/extension';
import { HistoryExtension } from '@lexical/history';
import { AutoLinkNode, LinkExtension, LinkNode } from '@lexical/link';
import { ListExtension, ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode, RichTextExtension } from '@lexical/rich-text';
import {
  configExtension,
  defineExtension,
  LineBreakNode,
  ParagraphNode,
} from 'lexical';

import {
  DragDropPasteExtension,
  ImagesExtension,
} from '@/components/extensions';
import {
  $createCodePlusNode,
  $createSimpleListItemNode,
  $createSimpleListNode,
  $createSimpleQuoteNode,
  CodePlusNode,
  EmojiNode,
  ImageNode,
  SimpleListItemNode,
  SimpleListNode,
  SimpleQuoteNode,
} from '@/components/nodes';
import {
  CodeHighlightExtension,
  validateUrlHandle,
} from '@/components/plugins';

export const SynclanEditorExtension = defineExtension({
  dependencies: [
    AutoFocusExtension,
    RichTextExtension,
    HistoryExtension,
    ClearEditorExtension,
    CodeHighlightExtension,
    /* @__PURE__ */ configExtension(ListExtension, {
      shouldPreserveNumbering: false,
    }),
    configExtension(LinkExtension, { validateUrl: validateUrlHandle }),
    ImagesExtension,
    DragDropPasteExtension,
    ClipboardDOMImportExtension,
  ],
  name: 'synclan-editor/base',
  namespace: 'synclan-editor/base',
  nodes: [
    AutoLinkNode,
    LinkNode,
    SimpleListNode,
    {
      replace: ListNode,
      with: (node: ListNode) =>
        $createSimpleListNode(node.getListType(), node.getStart()),
      withKlass: SimpleListNode,
    },
    SimpleListItemNode,
    {
      replace: ListItemNode,
      with: (node: ListItemNode) =>
        $createSimpleListItemNode(node.getChecked()),
      withKlass: SimpleListItemNode,
    },
    ParagraphNode,
    HeadingNode,
    SimpleQuoteNode,
    {
      replace: QuoteNode,
      with: () => $createSimpleQuoteNode(),
      withKlass: SimpleQuoteNode,
    },
    CodePlusNode,
    {
      replace: CodeNode,
      with: (node: CodeNode) =>
        $createCodePlusNode(node.getLanguage(), node.getTheme()),
      withKlass: CodePlusNode,
    },
    CodeHighlightNode,
    EmojiNode,
    LineBreakNode,
    ImageNode,
  ],
  theme: {
    code: 'block relative pt-7 pb-4 pl-[72px] pr-2 my-2 border rounded-md indent-0 before:box-border before:absolute before:top-0 before:left-0 before:content-[attr(data-gutter)] before:w-14 before:pt-[29px] before:px-2 before:pb-0 before:font-thin before:text-right',
    paragraph: 'mt-0 mb-0',
    link: 'font-light text-blue-500 no-underline cursor-pointer hover:underline',
    list: {
      ul: 'mt-0 mb-0 pl-0 list-outside marker:text-blue-500',
      ulDepth: ['list-disc', 'list-[circle]', 'list-[square]'],
      ol: 'mt-0 mb-0 pl-0 list-outside marker:text-blue-500 ',
      olDepth: ['list-decimal', 'list-[lower-alpha]', 'list-[lower-roman]'],
      listitem: 'mt-0 mb-0 ml-4 pl-2',
      nested: {
        listitem: 'ml-6 list-none',
      },
    },
    quote: 'm-0 pl-2 text-gray-400 border-l-2 border-input overflow-hidden',
    text: {
      bold: 'font-bold',
      strikethrough: 'line-through',
      italic: 'italic',
      underline: 'underline',
      underlineStrikethrough: '[text-decoration-line:underline_line-through]',
    },
    image: 'editor-image',
  },
});
