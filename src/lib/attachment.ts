import { produce } from 'immer';

import { uploadAttachment } from '@/services/cmd';

import { getAttachmentBaseUrl } from './constant';

interface EditorNode {
  type: string;
  attachmentId?: string;
  isFromSynclan?: boolean;
  src?: string;
  children?: EditorNode[];
  [key: string]: unknown;
}

export interface EditorStateJSON {
  root: EditorNode;
}

export function parseEditorState(content: string): EditorStateJSON | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function walk(node: EditorNode, urlMap: Map<string, string>) {
  if (node.type === 'image' && node.attachmentId) {
    const url = urlMap.get(node.attachmentId);

    if (url) {
      node.src = url;
      node.isFromSynclan = true;
      delete node.attachmentId;
    }
  }

  if (
    !Array.isArray(node.children) ||
    node.type === 'code-plus' ||
    node.type === 'code' ||
    node.type === 'link' ||
    node.type === 'text' ||
    node.type === 'emoji'
  ) {
    return;
  }

  for (const child of node.children) {
    walk(child, urlMap);
  }
}

function updateAttachmentUrls(
  editorState: EditorStateJSON,
  urlMap: Map<string, string>,
): EditorStateJSON {
  return produce(editorState, (draft) => {
    walk(draft.root, urlMap);
  });
}

export async function prepareMessageContent(
  content: string,
  attachments: Attachment[],
): Promise<string> {
  if (attachments.length === 0) {
    return content;
  }

  const uploadedUrls = await Promise.all(attachments.map(uploadAttachment));

  await Promise.all(
    uploadedUrls.map((url) =>
      preloadImageInMemory(`${getAttachmentBaseUrl()}/${url}`),
    ),
  );

  const editorState = parseEditorState(content);

  if (!editorState) {
    return content;
  }

  const urlMap = new Map<string, string>();

  attachments.forEach((attachment, index) => {
    if (attachment.id && uploadedUrls[index]) {
      urlMap.set(attachment.id, uploadedUrls[index]);
    }
  });

  const nextState = updateAttachmentUrls(editorState, urlMap);

  return JSON.stringify(nextState);
}

function preloadImageInMemory(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}
