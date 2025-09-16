import { useEffect, useRef, useState, type JSX } from 'react';
import {
  $createRangeSelection,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $normalizeSelection__EXPERIMENTAL,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  createCommand,
  getDOMSelection,
  type BaseSelection,
  type LexicalCommand,
  type LexicalNode,
  type NodeKey,
  type Point,
} from 'lexical';
import {
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  LinkNode,
  type LinkAttributes,
} from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Button, Input } from '../ui';
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
} from '@floating-ui/react';
import { $findMatchingParent } from '@lexical/utils';
import { $getAncestor } from './lib';
import invariant from './invariant';

// Source: https://stackoverflow.com/a/8234912/2013580
const urlRegExp = new RegExp(
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/,
);
export function validateUrlHandle(url: string): boolean {
  // TODO Fix UI for link insertion; it should never default to an invalid URL such as https://.
  // Maybe show a dialog where they user can type the URL before inserting it.
  return url === 'https://' || urlRegExp.test(url);
}

export const TOGGLE_LINK_CREATE_COMMAND: LexicalCommand<
  string | ({ url: string } & LinkAttributes) | null
> = createCommand('TOGGLE_LINK_CREATE_COMMAND');

type Props = {
  hasLinkAttributes?: boolean;
  validateUrl?: (url: string) => boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

function LinkPlugin({
  hasLinkAttributes = false,
  validateUrl = validateUrlHandle,
  onOpenChange,
}: Props): JSX.Element | null {
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [lastSelection, setLastSelection] = useState<BaseSelection | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const [editor] = useLexicalComposerContext();

  const { context, refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: (nextOpen) => {
      if (nextOpen) {
        setIsOpen(nextOpen);
      } else {
        onAfterCloseHandle();
      }

      onOpenChange?.(nextOpen);
    },
    placement: 'top-start',
    middleware: [offset(10), flip(), shift(), inline()],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context);

  const { getFloatingProps } = useInteractions([dismiss]);

  useEffect(() => {
    if (!editor.hasNodes([LinkNode])) {
      throw new Error('LinkPlugin: LinkNode not registered on editor');
    }

    return editor.registerCommand(
      TOGGLE_LINK_CREATE_COMMAND,
      (payload) => {
        console.log('payload', payload);
        const selection = $getSelection();

        if (payload === null) {
          $toggleLink(selection, payload);
          return true;
        } else if (typeof payload === 'string') {
          if (validateUrl === undefined || payload === '') {
            $toggleLink(
              selection,
              payload,
              hasLinkAttributes
                ? {
                    rel: 'noopener noreferrer',
                    target: '_blank',
                  }
                : void 0,
            );
            showEditor();
            return true;
          }
          return false;
        } else {
          const { url, target, rel, title } = payload;
          $toggleLink(selection, url, {
            ...(hasLinkAttributes
              ? {
                  rel: 'noopener noreferrer',
                  target: '_blank',
                }
              : void 0),
            rel,
            target,
            title,
          });
          showEditor();
          return true;
        }
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  // Restore selection from cursor pointer
  useEffect(() => {
    const root = editor.getRootElement();
    if (!root || !isOpen) return;

    const handler = (event: MouseEvent) => {
      editor.update(() => {
        // Get the cursor position corresponding to the click coordinates
        const caret = caretFromPoint(event.clientX, event.clientY);
        if (!caret) return;

        // Convert to Lexical Node
        const node = $getNearestNodeFromDOMNode(caret.node);
        if (!node) return;

        // Create a RangeSelection with the cursor positioned at the click location
        const selection = $createRangeSelection();
        selection.anchor.set(node.getKey(), caret.offset, 'text');
        selection.focus.set(node.getKey(), caret.offset, 'text');

        // Set editor selection
        $setSelection(selection);
      });
    };

    root.addEventListener('mousedown', handler);

    return () => {
      root.removeEventListener('mousedown', handler);
    };
  }, [editor, isOpen]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  const showEditor = () => {
    const selection = $getSelection();
    if (selection) {
      setLastSelection(selection.clone());
    }

    const nativeSelection = getDOMSelection(editor._window);
    if (nativeSelection && nativeSelection.rangeCount > 0) {
      const range = nativeSelection.getRangeAt(0),
        boundingClientRect = range.getBoundingClientRect(),
        clientRects = range.getClientRects();
      const virtualEl = {
        getBoundingClientRect: () => boundingClientRect,
        getClientRects: () => clientRects,
      };

      refs.setPositionReference(virtualEl);
      setIsOpen(true);
      onOpenChange?.(true);
    }

    $setSelection(null);
  };

  const onAfterCloseHandle = () => {
    // delayed close
    setTimeout(() => {
      setIsOpen(false);
    });

    setLinkUrl('');
    setLastSelection(null);

    editor.update(() => {
      if (lastSelection) {
        $toggleLink(lastSelection, null);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        className='py-3 px-4 space-y-3 border rounded-md bg-popover text-popover-foreground'
        style={floatingStyles}
        {...getFloatingProps}
      >
        <div className='flex items-center space-x-3'>
          <span className='inline-block w-8 text-xs'>链接</span>
          <Input
            ref={inputRef}
            value={linkUrl}
            className='w-56 h-7'
            placeholder='粘贴或输入一个链接'
            onChange={(event) => {
              setLinkUrl(event.target.value);
            }}
          />
        </div>
        <div className='flex justify-end items-center space-x-2'>
          <Button
            size='xxs'
            variant='outline'
            onClick={() => {
              onAfterCloseHandle();
              editor.focus();
            }}
          >
            取消
          </Button>
          <Button
            size='xxs'
            className='text-popover-foreground'
            // disabled={!validateUrl(linkUrl)}
            onClick={() => {
              // setIsOpen(false);
            }}
          >
            确认
          </Button>
        </div>
      </div>
    </FloatingPortal>
  );
}

/**
 * Generates or updates a LinkNode. It can also delete a LinkNode if the URL is null,
 * but saves any children and brings them up to the parent node.
 * @param url - The URL the link directs to.
 * @param attributes - Optional HTML a tag attributes. \\{ target, rel, title \\}
 */
export function $toggleLink(
  selection: BaseSelection | null,
  url: null | string,
  attributes: LinkAttributes = {},
): void {
  const { target, title } = attributes;
  const rel = attributes.rel === undefined ? 'noreferrer' : attributes.rel;
  if (
    selection === null ||
    (!$isRangeSelection(selection) && !$isNodeSelection(selection))
  ) {
    return;
  }

  if ($isNodeSelection(selection)) {
    const nodes = selection.getNodes();
    if (nodes.length === 0) {
      return;
    }

    // Handle all selected nodes
    nodes.forEach((node) => {
      if (url === null) {
        // Remove link
        const linkParent = $findMatchingParent(
          node,
          (parent): parent is LinkNode =>
            !$isAutoLinkNode(parent) && $isLinkNode(parent),
        );
        if (linkParent) {
          linkParent.insertBefore(node);
          if (linkParent.getChildren().length === 0) {
            linkParent.remove();
          }
        }
      } else {
        // Add/Update link
        const existingLink = $findMatchingParent(
          node,
          (parent): parent is LinkNode =>
            !$isAutoLinkNode(parent) && $isLinkNode(parent),
        );
        if (existingLink) {
          existingLink.setURL(url);
          if (target !== undefined) {
            existingLink.setTarget(target);
          }
          if (rel !== undefined) {
            existingLink.setRel(rel);
          }
        } else {
          const linkNode = $createLinkNode(url, { rel, target });
          node.insertBefore(linkNode);
          linkNode.append(node);
        }
      }
    });
    return;
  }

  // Handle RangeSelection
  const nodes = selection.extract();
  console.log('nodes', nodes);
  if (url === null) {
    // Remove LinkNodes
    nodes.forEach((node) => {
      const parentLink = $findMatchingParent(
        node,
        (parent): parent is LinkNode =>
          !$isAutoLinkNode(parent) && $isLinkNode(parent),
      );

      console.log('parentLink', parentLink);
      if (parentLink) {
        const children = parentLink.getChildren();

        for (let i = 0; i < children.length; i++) {
          parentLink.insertBefore(children[i]);
        }

        parentLink.remove();
      }
    });
    return;
  }
  const updatedNodes = new Set<NodeKey>();
  const updateLinkNode = (linkNode: LinkNode) => {
    if (updatedNodes.has(linkNode.getKey())) {
      return;
    }
    updatedNodes.add(linkNode.getKey());
    linkNode.setURL(url);
    if (target !== undefined) {
      linkNode.setTarget(target);
    }
    if (rel !== undefined) {
      linkNode.setRel(rel);
    }
    if (title !== undefined) {
      linkNode.setTitle(title);
    }
  };
  // Add or merge LinkNodes
  if (nodes.length === 1) {
    const firstNode = nodes[0];
    // if the first node is a LinkNode or if its
    // parent is a LinkNode, we update the URL, target and rel.
    const linkNode = $getAncestor(firstNode, $isLinkNode);
    if (linkNode !== null) {
      return updateLinkNode(linkNode);
    }
  }

  $withSelectedNodes(() => {
    let linkNode: LinkNode | null = null;
    for (const node of nodes) {
      if (!node.isAttached()) {
        continue;
      }
      const parentLinkNode = $getAncestor(node, $isLinkNode);
      if (parentLinkNode) {
        updateLinkNode(parentLinkNode);
        continue;
      }
      if ($isElementNode(node)) {
        if (!node.isInline()) {
          // Ignore block nodes, if there are any children we will see them
          // later and wrap in a new LinkNode
          continue;
        }
        if ($isLinkNode(node)) {
          // If it's not an autolink node and we don't already have a LinkNode
          // in this block then we can update it and re-use it
          if (
            !$isAutoLinkNode(node) &&
            (linkNode === null || !linkNode.getParentOrThrow().isParentOf(node))
          ) {
            updateLinkNode(node);
            linkNode = node;
            continue;
          }
          // Unwrap LinkNode, we already have one or it's an AutoLinkNode
          for (const child of node.getChildren()) {
            node.insertBefore(child);
          }
          node.remove();
          continue;
        }
      }
      const prevLinkNode = node.getPreviousSibling();
      if ($isLinkNode(prevLinkNode) && prevLinkNode.is(linkNode)) {
        prevLinkNode.append(node);
        continue;
      }
      linkNode = $createLinkNode(url, { rel, target, title });
      node.insertAfter(linkNode);
      linkNode.append(node);
    }
  });
}

/**
 * Preserve the logical start/end of a RangeSelection in situations where
 * the point is an element that may be reparented in the callback.
 *
 * @param $fn The function to run
 * @returns The result of the callback
 */
function $withSelectedNodes<T>($fn: () => T): T {
  const initialSelection = $getSelection();
  if (!$isRangeSelection(initialSelection)) {
    return $fn();
  }
  const normalized = $normalizeSelection__EXPERIMENTAL(initialSelection);
  const isBackwards = normalized.isBackward();
  const anchorNode = $getPointNode(normalized.anchor, isBackwards ? -1 : 0);
  const focusNode = $getPointNode(normalized.focus, isBackwards ? 0 : -1);
  const rval = $fn();
  if (anchorNode || focusNode) {
    const updatedSelection = $getSelection();
    if ($isRangeSelection(updatedSelection)) {
      const finalSelection = updatedSelection.clone();
      if (anchorNode) {
        const anchorParent = anchorNode.getParent();
        if (anchorParent) {
          finalSelection.anchor.set(
            anchorParent.getKey(),
            anchorNode.getIndexWithinParent() + (isBackwards ? 1 : 0),
            'element',
          );
        }
      }
      if (focusNode) {
        const focusParent = focusNode.getParent();
        if (focusParent) {
          finalSelection.focus.set(
            focusParent.getKey(),
            focusNode.getIndexWithinParent() + (isBackwards ? 0 : 1),
            'element',
          );
        }
      }
      $setSelection($normalizeSelection__EXPERIMENTAL(finalSelection));
    }
  }
  return rval;
}

function $getPointNode(point: Point, offset: number): LexicalNode | null {
  if (point.type === 'element') {
    const node = point.getNode();
    invariant(
      $isElementNode(node),
      '$getPointNode: element point is not an ElementNode',
    );
    const childNode = node.getChildren()[point.offset + offset];
    return childNode || null;
  }
  return null;
}

function caretFromPoint(
  x: number,
  y: number,
): null | {
  offset: number;
  node: Node;
} {
  if (typeof document.caretRangeFromPoint !== 'undefined') {
    const range = document.caretRangeFromPoint(x, y);
    if (range === null) {
      return null;
    }
    return {
      node: range.startContainer,
      offset: range.startOffset,
    };
    // @ts-ignore
  } else if (document.caretPositionFromPoint !== 'undefined') {
    // @ts-ignore FF - no types
    const range = document.caretPositionFromPoint(x, y);
    if (range === null) {
      return null;
    }
    return {
      node: range.offsetNode,
      offset: range.offset,
    };
  } else {
    // Gracefully handle IE
    return null;
  }
}

export { LinkPlugin };
