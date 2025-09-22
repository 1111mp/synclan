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
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  getDOMSelection,
  type LexicalEditor,
  type LexicalCommand,
  type LexicalNode,
  type NodeKey,
  type Point,
  $getNodeByKey,
  $createTextNode,
} from 'lexical';
import {
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  LinkNode,
  type LinkAttributes,
} from '@lexical/link';
import { Button, Input, Label } from '../ui';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
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
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { $getAncestor, getSelectedNode } from './lib';
import invariant from './invariant';
import { $isEmojiNode } from '../nodes';

// Source: https://stackoverflow.com/a/8234912/2013580
const urlRegExp = new RegExp(
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/,
);
export function validateUrlHandle(url: string): boolean {
  // TODO Fix UI for link insertion; it should never default to an invalid URL such as https://.
  // Maybe show a dialog where they user can type the URL before inserting it.
  return urlRegExp.test(url);
}

export const TOGGLE_LINK_CREATE_COMMAND: LexicalCommand<
  string | ({ url: string } & LinkAttributes) | null
> = createCommand('TOGGLE_LINK_CREATE_COMMAND');

type Props = {
  hasLinkAttributes?: boolean;
  validateUrl?: (url: string) => boolean;
};

type LinkNodeInfo = {
  key: string;
  url: string;
  text: string;
};

function LinkPlugin({
  hasLinkAttributes = false,
  validateUrl = validateUrlHandle,
}: Props): JSX.Element | null {
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activedLinkNode, setActivedLinkNode] = useState<LinkNodeInfo | null>(
    null,
  );
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [nodeText, setNodeText] = useState<string>('');
  const [nodeUrl, setNodeUrl] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingLinkNodes = useRef<NodeKey[]>([]);

  const [editor] = useLexicalComposerContext();

  const { context, refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: (nextOpen, _event, reason) => {
      if (nextOpen) {
        setIsOpen(nextOpen);
      } else {
        onAfterCloseHandle();
        if (reason === 'escape-key') {
          editor?.focus();
        }
      }
    },
    placement: 'top-start',
    middleware: [offset(10), flip(), shift(), inline()],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context, {
    outsidePressEvent: activedLinkNode !== null ? 'click' : 'mousedown',
    outsidePress: (event) => {
      const target = event.target as HTMLElement;
      if (
        isOpen &&
        activedLinkNode !== null &&
        !isEdit &&
        target.closest('#synclan-composition-scroll-wrapper a')
      ) {
        return false;
      }
      return true;
    },
  });

  const { getFloatingProps } = useInteractions([dismiss]);

  const updatePendingLinkNodes = (key: NodeKey) => {
    pendingLinkNodes.current.push(key);
  };

  useEffect(() => {
    if (!editor.hasNodes([LinkNode])) {
      throw new Error('LinkPlugin: LinkNode not registered on editor');
    }

    const showEditor = () => {
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
      }

      $setSelection(null);
    };

    const attributes = hasLinkAttributes
      ? {
          rel: 'noopener noreferrer',
          target: '_blank',
        }
      : void 0;

    return mergeRegister(
      editor.registerCommand(
        TOGGLE_LINK_CREATE_COMMAND,
        (payload) => {
          if (payload === null) {
            $toggleLink(editor, payload, {}, updatePendingLinkNodes);
            return true;
          } else if (typeof payload === 'string') {
            if (
              payload === '' ||
              validateUrl === undefined ||
              validateUrl(payload)
            ) {
              $toggleLink(editor, payload, attributes, updatePendingLinkNodes);
              showEditor();
              return true;
            }
            return false;
          } else {
            const { url, target, rel, title } = payload;
            $toggleLink(
              editor,
              url,
              {
                ...attributes,
                rel,
                target,
                title,
              },
              updatePendingLinkNodes,
            );
            showEditor();
            return true;
          }
        },
        COMMAND_PRIORITY_HIGH,
      ),

      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          const node = $getNearestNodeFromDOMNode(event.target as HTMLElement);
          if (!node) return false;

          const linkNode = $findMatchingParent(node, $isLinkNode);
          if ($isLinkNode(linkNode)) {
            event.preventDefault();

            if (!linkNode.getURL() || !validateUrl(linkNode.getURL()))
              return false;

            if (event.metaKey || event.ctrlKey) {
              window.open(linkNode.getURL(), '_blank');
            } else {
              const element = editor.getElementByKey(linkNode.getKey());
              if (!element) return true;

              const virtualEl = {
                getBoundingClientRect: () => element.getBoundingClientRect(),
                getClientRects: () => element.getClientRects(),
              };

              refs.setPositionReference(virtualEl);

              setActivedLinkNode({
                key: linkNode.getKey(),
                url: linkNode.getURL(),
                text: linkNode.getTextContent(),
              });
              setIsOpen(true);
            }
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, refs, hasLinkAttributes, validateUrl, setIsOpen]);

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

  const onAfterCloseHandle = () => {
    // delayed close
    setTimeout(() => {
      setIsOpen(false);
    });

    editor.update(() => {
      pendingLinkNodes.current.forEach((key) => {
        const linkNode = $getNodeByKey(key);
        if ($isLinkNode(linkNode)) {
          // Unwrap LinkNode, we already have one or it's an AutoLinkNode
          for (const child of linkNode.getChildren()) {
            linkNode.insertBefore(child);
          }
          linkNode.remove();
        }
      });

      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const parent = getSelectedNode(selection).getParent();
        if ($isAutoLinkNode(parent)) {
          const linkNode = $createLinkNode(parent.getURL(), {
            rel: parent.__rel,
            target: parent.__target,
            title: parent.__title,
          });
          parent.replace(linkNode, true);
        }
      }
    });
    pendingLinkNodes.current = [];

    setLinkUrl('');

    setIsEdit(false);
    setNodeUrl('');
    setNodeText('');
    setActivedLinkNode(null);
  };

  const handleLinkSubmission = (
    event:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLElement>,
  ) => {
    event.preventDefault();

    // delayed close
    setTimeout(() => {
      setIsOpen(false);
    });

    editor.update(() => {
      pendingLinkNodes.current.forEach((key) => {
        const linkNode = $getNodeByKey(key);
        if ($isLinkNode(linkNode)) {
          updateLinkNodeInfo(
            linkNode,
            linkUrl,
            hasLinkAttributes
              ? { rel: 'noopener noreferrer', target: '_blank' }
              : void 0,
          );
          $updateLinkNodeTransition(editor, key, true);
          linkNode.select();
        }
      });

      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const parent = getSelectedNode(selection).getParent();
        if ($isAutoLinkNode(parent)) {
          const linkNode = $createLinkNode(parent.getURL(), {
            rel: parent.__rel,
            target: parent.__target,
            title: parent.__title,
          });
          parent.replace(linkNode, true);
        }
      }
    });

    pendingLinkNodes.current = [];

    setLinkUrl('');
  };

  const handleLinkInfoSubmission = (
    event:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLElement>,
  ) => {
    event.preventDefault();

    if (activedLinkNode === null) return;

    // delayed close
    setTimeout(() => {
      setIsOpen(false);
    });

    if (validateUrl(nodeUrl) && nodeText.trim() !== '') {
      editor.update(() => {
        const linkNode = $getNodeByKey(activedLinkNode?.key);
        if ($isLinkNode(linkNode)) {
          linkNode.setURL(nodeUrl);

          const children = linkNode.getChildren();
          if (children.length > 0) {
            children[0].replace($createTextNode(nodeText));
            for (let i = 1; i < children.length; i++) {
              children[i].remove();
            }
          } else {
            linkNode.append($createTextNode(nodeText));
          }

          linkNode.selectEnd();
        }
      });
    }

    pendingLinkNodes.current = [];

    setIsEdit(false);
    setNodeUrl('');
    setNodeText('');
    setActivedLinkNode(null);
  };

  if (!isOpen) return null;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        className='py-3 px-4 space-y-3 border rounded-md bg-popover text-popover-foreground'
        style={floatingStyles}
        {...getFloatingProps()}
      >
        {activedLinkNode === null ? (
          <>
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
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && validateUrlHandle(linkUrl)) {
                    handleLinkSubmission(event);
                  }
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
                disabled={!validateUrl(linkUrl)}
                onClick={handleLinkSubmission}
              >
                确认
              </Button>
            </div>
          </>
        ) : (
          <div className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <Label className='font-light'>文本：</Label>
              {isEdit ? (
                <Input
                  autoFocus
                  className='w-56 h-7'
                  value={nodeText}
                  onChange={(event) => {
                    setNodeText(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleLinkInfoSubmission(event);
                    }
                  }}
                />
              ) : (
                <p className='w-56 truncate'>{activedLinkNode.text}</p>
              )}
            </div>
            <div className='flex items-center space-x-2'>
              <Label className='font-light'>链接：</Label>
              {isEdit ? (
                <Input
                  className='w-56 h-7'
                  value={nodeUrl}
                  onChange={(event) => {
                    setNodeUrl(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleLinkInfoSubmission(event);
                    }
                  }}
                />
              ) : (
                <p>
                  <span
                    className='inline-block max-w-56 truncate cursor-pointer hover:underline text-blue-500'
                    onClick={() => {
                      window.open(activedLinkNode.url, '_blank');
                    }}
                  >
                    {activedLinkNode.url}
                  </span>
                </p>
              )}
            </div>
            <div className='flex justify-end'>
              {isEdit ? (
                <div className='flex item-center space-x-2'>
                  <Button
                    size='xxs'
                    variant='outline'
                    onClick={() => {
                      onAfterCloseHandle();
                      editor?.focus();
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    size='xxs'
                    className='text-popover-foreground'
                    disabled={!validateUrl(nodeUrl)}
                    onClick={handleLinkInfoSubmission}
                  >
                    确认
                  </Button>
                </div>
              ) : (
                <Button
                  className='font-light'
                  variant='outline'
                  size='xxs'
                  onClick={() => {
                    setIsEdit(true);
                    setNodeUrl(activedLinkNode.url);
                    setNodeText(activedLinkNode.text);
                  }}
                >
                  编辑链接
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </FloatingPortal>
  );
}

function updateLinkNodeInfo(
  linkNode: LinkNode,
  url: string,
  attributes: LinkAttributes = {},
) {
  const { target, title } = attributes;
  const rel = attributes.rel === undefined ? 'noreferrer' : attributes.rel;

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
}

/**
 * Generates or updates a LinkNode. It can also delete a LinkNode if the URL is null,
 * but saves any children and brings them up to the parent node.
 * @param url - The URL the link directs to.
 * @param attributes - Optional HTML a tag attributes. \\{ target, rel, title \\}
 */
export function $toggleLink(
  editor: LexicalEditor,
  // selection: BaseSelection | null,
  url: null | string,
  attributes: LinkAttributes = {},
  updatePendingLinkNodes?: (key: NodeKey) => void,
): void {
  const { target, title } = attributes;
  const rel = attributes.rel === undefined ? 'noreferrer' : attributes.rel;
  const selection = $getSelection();
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
          $updateLinkNodeTransition(editor, existingLink.getKey(), true);
        } else {
          const linkNode = $createLinkNode(url, { rel, target });
          updatePendingLinkNodes?.(linkNode.getKey());
          $updateLinkNodeTransition(editor, linkNode.getKey());
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

  // Add or merge LinkNodes
  if (nodes.length === 1) {
    const firstNode = nodes[0];
    // if the first node is a LinkNode or if its
    // parent is a LinkNode, we update the URL, target and rel.
    const linkNode = $getAncestor(firstNode, $isLinkNode);
    if (linkNode !== null) {
      // return updateLinkNode(linkNode);
      return;
    }
  }

  $withSelectedNodes(() => {
    let linkNode: LinkNode | null = null;
    for (const node of nodes) {
      if (!node.isAttached()) {
        continue;
      }

      if ($isEmojiNode(node)) {
        continue;
      }

      const parentLinkNode = $getAncestor(node, $isLinkNode);
      if (parentLinkNode) {
        continue;
      }
      if ($isElementNode(node)) {
        if (!node.isInline() || $isEmojiNode(node)) {
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
      updatePendingLinkNodes?.(linkNode.getKey());
      $updateLinkNodeTransition(editor, linkNode.getKey());
      node.insertAfter(linkNode);
      linkNode.append(node);
    }
  });
}

function $updateLinkNodeTransition(
  editor: LexicalEditor,
  key: string,
  isRemove: boolean = false,
): void {
  setTimeout(() => {
    const element = editor.getElementByKey(key);
    if (!element) return;
    const classNames = [
      'bg-input',
      'text-foreground',
      'cursor-text!',
      'hover:no-underline!',
    ];
    if (isRemove) {
      element.classList.remove(...classNames);
    } else {
      element.classList.add(...classNames);
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
    // oxlint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  } else if (document.caretPositionFromPoint !== 'undefined') {
    // oxlint-disable-next-line @typescript-eslint/ban-ts-comment
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
