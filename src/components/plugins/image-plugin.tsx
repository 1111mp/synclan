import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, mergeRegister } from 'lexical';
import { useEffect } from 'react';

import { $isImageNode, ImageNode } from '@/components/nodes';

import { calculateImageDisplaySize } from '../nodes/utils';

function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerMutationListener(ImageNode, (mutations) => {
        for (const [nodeKey, mutation] of mutations) {
          editor.getEditorState().read(() => {
            if (mutation === 'created') {
              const node = $getNodeByKey(nodeKey);
              if ($isImageNode(node)) {
                const src = node.getSrc();
                const unResolvedWidth =
                  !node.__width || node.__width === 'inherit';
                const unResolvedHeight =
                  !node.__height || node.__height === 'inherit';

                if (
                  src &&
                  !src.startsWith('data:') &&
                  !src.startsWith('file:') &&
                  (unResolvedWidth || unResolvedHeight)
                ) {
                  const img = new Image();
                  img.src = src;
                  img.onload = () => {
                    editor.update(() => {
                      const latestNode = $getNodeByKey(nodeKey);
                      if ($isImageNode(latestNode)) {
                        const { width: displayWidth, height: displayHeight } =
                          calculateImageDisplaySize(
                            img.naturalWidth,
                            img.naturalHeight,
                          );
                        latestNode.setWidthAndHeight(
                          displayWidth,
                          displayHeight,
                        );
                      }
                    });
                  };
                }
              }
            }
          });
        }
      }),
    );
  }, [editor]);

  return null;
}

export { ImagePlugin };
