/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { isMimeType, mediaFileReader } from '@lexical/utils';
import { COMMAND_PRIORITY_LOW, defineExtension } from 'lexical';
import { v4 as uuidv4 } from 'uuid';

import { calculateImageDisplaySize } from '../nodes/utils';
import { INSERT_IMAGE_COMMAND } from './image-extension';

const ACCEPTABLE_IMAGE_TYPES = [
  'image/',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/webp',
];

export const DragDropPasteExtension = /* @__PURE__ */ defineExtension({
  name: 'synclan-editor/DragDropPaste',
  register: (editor) =>
    editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        void (async () => {
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x),
          );

          for (const { file, result } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              const bitmap = await createImageBitmap(file);
              const { width: displayWidth, height: displayHeight } =
                calculateImageDisplaySize(bitmap.width, bitmap.height);

              editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                altText: file.name,
                src: result,
                attachmentId: uuidv4(),
                width: displayWidth,
                height: displayHeight,
              });
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    ),
});
