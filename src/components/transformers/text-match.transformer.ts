import { $createTextNode } from 'lexical';
import type { TextMatchTransformer } from '@lexical/markdown';
import {
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  LinkNode,
} from '@lexical/link';

const BOLD_STAR: TextMatchTransformer = {
  dependencies: [],
  type: 'text-match',
  trigger: ' ',
  regExp: /\*\*(.*?)\*\*\s$/,
  replace: (textNode, match) => {
    const text = match[1];
    const boldNode = $createTextNode(text).toggleFormat('bold');
    textNode.replace(boldNode);

    const spaceNode = $createTextNode(' ');
    boldNode.insertAfter(spaceNode, true);
  },
};

const ITALIC_STAR: TextMatchTransformer = {
  dependencies: [],
  type: 'text-match',
  trigger: ' ',
  regExp: /\*(.*?)\*\s$/,
  replace: (textNode, match) => {
    const text = match[1];
    const italicNode = $createTextNode(text).toggleFormat('italic');
    textNode.replace(italicNode);

    const spaceNode = $createTextNode(' ');
    italicNode.insertAfter(spaceNode, true);
  },
};

const STRIKETHROUGH: TextMatchTransformer = {
  dependencies: [],
  type: 'text-match',
  trigger: ' ',
  regExp: /~~(.*?)~~\s$/,
  replace: (textNode, match) => {
    const text = match[1];
    const strikeNode = $createTextNode(text).toggleFormat('strikethrough');
    textNode.replace(strikeNode);

    const spaceNode = $createTextNode(' ');
    strikeNode.insertAfter(spaceNode, true);
  },
};

const UNDERLINE: TextMatchTransformer = {
  dependencies: [],
  type: 'text-match',
  trigger: ' ',
  regExp: /~(.*?)~\s$/,
  replace: (textNode, match) => {
    const text = match[1];
    const strikeNode = $createTextNode(text).toggleFormat('underline');
    textNode.replace(strikeNode);

    const spaceNode = $createTextNode(' ');
    strikeNode.insertAfter(spaceNode, true);
  },
};

const LINK: TextMatchTransformer = {
  dependencies: [LinkNode],
  export: (node, exportChildren, _exportFormat) => {
    if (!$isLinkNode(node) || $isAutoLinkNode(node)) {
      return null;
    }
    const title = node.getTitle();

    const textContent = exportChildren(node);

    const linkContent = title
      ? `[${textContent}](${node.getURL()} "${title}")`
      : `[${textContent}](${node.getURL()})`;

    return linkContent;
  },
  importRegExp:
    /(?:\[(.*?)\])(?:\((?:([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?)\))/,
  regExp:
    /(?:\[(.*?)\])(?:\((?:([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?)\))\s?$/,
  replace: (textNode, match) => {
    const [, linkText, linkUrl, linkTitle] = match;
    const linkNode = $createLinkNode(linkUrl, { title: linkTitle });
    const openBracketAmount = linkText.split('[').length - 1;
    const closeBracketAmount = linkText.split(']').length - 1;
    let parsedLinkText = linkText;
    let outsideLinkText = '';
    if (openBracketAmount < closeBracketAmount) {
      return;
    } else if (openBracketAmount > closeBracketAmount) {
      const linkTextParts = linkText.split('[');
      outsideLinkText = '[' + linkTextParts[0];
      parsedLinkText = linkTextParts.slice(1).join('[');
    }
    const linkTextNode = $createTextNode(parsedLinkText);
    linkTextNode.setFormat(textNode.getFormat());
    linkNode.append(linkTextNode);
    textNode.replace(linkNode);

    if (outsideLinkText) {
      linkNode.insertBefore($createTextNode(outsideLinkText));
    }

    const spaceNode = $createTextNode(' ');
    linkNode.insertAfter(spaceNode, true);

    return linkTextNode;
  },
  trigger: ' ',
  type: 'text-match',
};

export const TEXT_MATCH_TRANSFORMERS: Array<TextMatchTransformer> = [
  BOLD_STAR,
  ITALIC_STAR,
  STRIKETHROUGH,
  UNDERLINE,
  LINK,
];
