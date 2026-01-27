import { $getState, $setState, createState, type ElementNode } from 'lexical';
import type { ListType } from '@lexical/list';
import { QUOTE, type ElementTransformer } from '@lexical/markdown';
import {
  $createSimpleListItemNode,
  $createSimpleListNode,
  $isSimpleListItemNode,
  $isSimpleListNode,
  $isSimpleQuoteNode,
  SimpleListItemNode,
  SimpleListNode,
} from '../nodes';

const ORDERED_LIST_REGEX = /^(\s*)(\d{1,})\.\s/;
const UNORDERED_LIST_REGEX = /^(\s*)[-*+]\s/;

export const listMarkerState = createState('mdListMarker', {
  parse: (v) => (typeof v === 'string' && /^[-*+]$/.test(v) ? v : '-'),
});

const LIST_INDENT_SIZE = 4;

function getIndent(whitespaces: string): number {
  const tabs = whitespaces.match(/\t/g);
  const spaces = whitespaces.match(/ /g);

  let indent = 0;

  if (tabs) {
    indent += tabs.length;
  }

  if (spaces) {
    indent += Math.floor(spaces.length / LIST_INDENT_SIZE);
  }

  return indent;
}

const listReplace = (listType: ListType): ElementTransformer['replace'] => {
  return (parentNode, children, match, isImport) => {
    const previousNode = parentNode.getPreviousSibling();
    const nextNode = parentNode.getNextSibling();
    const listItem = $createSimpleListItemNode(
      listType === 'check' ? match[3] === 'x' : undefined,
    );
    const firstMatchChar = match[0].trim()[0];
    const listMarker =
      (listType === 'bullet' || listType === 'check') &&
      firstMatchChar === listMarkerState.parse(firstMatchChar)
        ? firstMatchChar
        : undefined;

    if ($isSimpleListNode(nextNode) && nextNode.getListType() === listType) {
      if (listMarker) {
        $setState(nextNode, listMarkerState, listMarker);
      }
      const firstChild = nextNode.getFirstChild();
      if (firstChild !== null) {
        firstChild.insertBefore(listItem);
      } else {
        // should never happen, but let's handle gracefully, just in case.
        nextNode.append(listItem);
      }
      parentNode.remove();
    } else if (
      $isSimpleListNode(previousNode) &&
      previousNode.getListType() === listType
    ) {
      if (listMarker) {
        $setState(previousNode, listMarkerState, listMarker);
      }
      previousNode.append(listItem);
      parentNode.remove();
    } else {
      const list = $createSimpleListNode(
        listType,
        listType === 'number' ? Number(match[2]) : undefined,
      );
      if (listMarker) {
        $setState(list, listMarkerState, listMarker);
      }
      list.append(listItem);
      if ($isSimpleQuoteNode(parentNode)) {
        parentNode.append(list);
      } else {
        parentNode.replace(list);
      }
    }
    listItem.append(...children);
    if (!isImport) {
      listItem.select(0, 0);
    }
    const indent = getIndent(match[1]);
    if (indent) {
      listItem.setIndent(indent);
    }
  };
};

const $listExport = (
  listNode: SimpleListNode,
  exportChildren: (node: ElementNode) => string,
  depth: number,
): string => {
  const output = [];
  const children = listNode.getChildren();
  let index = 0;
  for (const listItemNode of children) {
    if ($isSimpleListItemNode(listItemNode)) {
      if (listItemNode.getChildrenSize() === 1) {
        const firstChild = listItemNode.getFirstChild();
        if ($isSimpleListNode(firstChild)) {
          output.push($listExport(firstChild, exportChildren, depth + 1));
          continue;
        }
      }
      const indent = ' '.repeat(depth * LIST_INDENT_SIZE);
      const listType = listNode.getListType();
      const listMarker = $getState(listNode, listMarkerState);
      const prefix =
        listType === 'number'
          ? `${listNode.getStart() + index}. `
          : listType === 'check'
            ? `${listMarker} [${listItemNode.getChecked() ? 'x' : ' '}] `
            : listMarker + ' ';
      output.push(indent + prefix + exportChildren(listItemNode));
      index++;
    }
  }

  return output.join('\n');
};

export const UNORDERED_LIST: ElementTransformer = {
  dependencies: [SimpleListNode, SimpleListItemNode],
  export: (node, exportChildren) => {
    return $isSimpleListNode(node)
      ? $listExport(node, exportChildren, 0)
      : null;
  },
  regExp: UNORDERED_LIST_REGEX,
  replace: listReplace('bullet'),
  type: 'element',
};

export const ORDERED_LIST: ElementTransformer = {
  dependencies: [SimpleListNode, SimpleListItemNode],
  export: (node, exportChildren) => {
    return $isSimpleListNode(node)
      ? $listExport(node, exportChildren, 0)
      : null;
  },
  regExp: ORDERED_LIST_REGEX,
  replace: listReplace('number'),
  type: 'element',
};

export const ELEMENT_TRANSFORMERS: Array<ElementTransformer> = [
  QUOTE,
  UNORDERED_LIST,
  ORDERED_LIST,
];
