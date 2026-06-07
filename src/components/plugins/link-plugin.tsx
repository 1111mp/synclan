import { useEffect, useRef, useState, type JSX } from 'react';
import {
  $createRangeSelection,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $normalizeSelection__EXPERIMENTAL,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  getDOMSelection,
  type BaseSelection,
  type LexicalCommand,
  type LexicalNode,
  type NodeKey,
  type Point,
  type RangeSelection,
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
import { $createPreLinkNode, $isPreLinkNode, PreLinkNode } from '../nodes';
import { $findMatchingParent } from '@lexical/utils';
import { $getAncestor } from './lib';
import invariant from './invariant';

// Source: https://stackoverflow.com/a/8234912/2013580
const urlRegExp = new RegExp(
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/,
);
export function validateUrl(url: string): boolean {
  // TODO Fix UI for link insertion; it should never default to an invalid URL such as https://.
  // Maybe show a dialog where they user can type the URL before inserting it.
  return url !== '' && urlRegExp.test(url);
}

export const TOGGLE_LINK_CREATE_COMMAND: LexicalCommand<
  string | ({ url: string } & LinkAttributes) | null
> = createCommand('TOGGLE_LINK_CREATE_COMMAND');

type Props = {
  hasLinkAttributes?: boolean;
};

function LinkPlugin({ hasLinkAttributes = false }: Props): JSX.Element | null {
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [lastSelection, setLastSelection] = useState<Pick<
    RangeSelection,
    'anchor' | 'focus'
  > | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editor] = useLexicalComposerContext();

  const { context, refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: (nextOpen, _event, reason) => {
      setIsOpen(nextOpen);

      // hide
      if (!nextOpen) {
        setLinkUrl('');
        setLastSelection(null);

        if (reason === 'escape-key') {
          onAfterCloseHandle();
        } else {
          setTimeout(() => {
            onAfterCloseHandle();
          });
        }
      }
    },
    placement: 'top-start',
    middleware: [offset(10), flip(), shift(), inline()],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context);

  const { getFloatingProps } = useInteractions([dismiss]);

  useEffect(() => {
    return editor.registerCommand(
      TOGGLE_LINK_CREATE_COMMAND,
      () => {
        const selection = $getSelection();
        const nativeSelection = getDOMSelection(editor._window);
        const rootElement = editor.getRootElement();

        if (
          selection !== null &&
          nativeSelection !== null &&
          rootElement !== null &&
          editor.isEditable() &&
          rootElement.contains(nativeSelection.anchorNode) &&
          nativeSelection.rangeCount > 0
        ) {
          if ($isRangeSelection(selection)) {
            setLastSelection({
              anchor: selection.anchor,
              focus: selection.focus,
            });
          }

          const range = nativeSelection.getRangeAt(0),
            boundingClientRect = range.getBoundingClientRect(),
            clientRects = range.getClientRects();
          const virtualEl = {
            getBoundingClientRect: () => boundingClientRect,
            getClientRects: () => clientRects,
          };

          refs.setPositionReference(virtualEl);
          console.log('7878787887878');
          setIsOpen(true);
          $togglePreLink(selection);
        }

        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  const onAfterCloseHandle = () => {
    editor.update(() => {
      if (!lastSelection) return;

      const rangeSelection = $createRangeSelection();
      rangeSelection.anchor.set(
        lastSelection.anchor.key,
        lastSelection.anchor.offset,
        lastSelection.anchor.type,
      );
      rangeSelection.focus.set(
        lastSelection.focus.key,
        lastSelection.focus.offset,
        lastSelection.focus.type,
      );

      if (rangeSelection) {
        $togglePreLink(rangeSelection, true);
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
              setIsOpen(false);
              onAfterCloseHandle();
            }}
          >
            取消
          </Button>
          <Button
            size='xxs'
            disabled={!validateUrl(linkUrl)}
            onClick={() => {
              setIsOpen(false);

              setTimeout(() => {
                editor.update(() => {
                  if (!lastSelection) return;

                  const rangeSelection = $createRangeSelection();
                  rangeSelection.anchor.set(
                    lastSelection.anchor.key,
                    lastSelection.anchor.offset,
                    lastSelection.anchor.type,
                  );
                  rangeSelection.focus.set(
                    lastSelection.focus.key,
                    lastSelection.focus.offset,
                    lastSelection.focus.type,
                  );

                  if (rangeSelection) {
                    $toggleLink(
                      rangeSelection,
                      linkUrl,
                      hasLinkAttributes
                        ? {
                            rel: 'noopener noreferrer',
                            target: '_blank',
                          }
                        : undefined,
                    );
                  }
                });
              });
            }}
          >
            确认
          </Button>
        </div>
      </div>
    </FloatingPortal>
  );
}

function $toggleLink(
  selection: BaseSelection | null,
  url: null | string,
  attributes: LinkAttributes = {},
): void {
  const { target, title } = attributes;
  const rel = attributes.rel === undefined ? 'noreferrer' : attributes.rel;
  // const selection = $getSelection();

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

  if (url === null) {
    // Remove LinkNodes
    nodes.forEach((node) => {
      const parentLink = $findMatchingParent(
        node,
        (parent): parent is LinkNode =>
          !$isAutoLinkNode(parent) && $isLinkNode(parent),
      );

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

function $togglePreLink(
  selection: BaseSelection | null,
  isRemove: boolean = false,
): void {
  if (
    selection === null ||
    !$isRangeSelection(selection) ||
    $isNodeSelection(selection)
  ) {
    return;
  }

  // Handle RangeSelection
  const nodes = selection.extract();

  if (isRemove) {
    // Remove LinkNodes
    nodes.forEach((node) => {
      const parentPreLink = $findMatchingParent(
        node,
        (parent): parent is PreLinkNode =>
          !$isAutoLinkNode(parent) && $isPreLinkNode(parent),
      );

      if (parentPreLink) {
        const children = parentPreLink.getChildren();

        for (let i = 0; i < children.length; i++) {
          parentPreLink.insertBefore(children[i]);
        }

        parentPreLink.remove();
      }
    });
    return;
  }
  const updatedNodes = new Set<NodeKey>();
  const updateLinkNode = (linkNode: PreLinkNode) => {
    if (updatedNodes.has(linkNode.getKey())) {
      return;
    }
    updatedNodes.add(linkNode.getKey());
  };
  // Add or merge LinkNodes
  if (nodes.length === 1) {
    const firstNode = nodes[0];
    // if the first node is a LinkNode or if its
    // parent is a LinkNode, we update the URL, target and rel.
    const linkNode = $getAncestor(firstNode, $isPreLinkNode);
    if (linkNode !== null) {
      return updateLinkNode(linkNode);
    }
  }

  $withSelectedNodes(() => {
    let preLinkNode: PreLinkNode | null = null;
    for (const node of nodes) {
      if (!node.isAttached()) {
        continue;
      }
      const parentLinkNode = $getAncestor(node, $isPreLinkNode);
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
        if ($isPreLinkNode(node)) {
          // If it's not an autolink node and we don't already have a LinkNode
          // in this block then we can update it and re-use it
          if (
            !$isAutoLinkNode(node) &&
            (preLinkNode === null ||
              !preLinkNode.getParentOrThrow().isParentOf(node))
          ) {
            updateLinkNode(node);
            preLinkNode = node;
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
      if ($isPreLinkNode(prevLinkNode) && prevLinkNode.is(preLinkNode)) {
        prevLinkNode.append(node);
        continue;
      }
      preLinkNode = $createPreLinkNode();
      node.insertAfter(preLinkNode);
      preLinkNode.append(node);
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

export { LinkPlugin };
