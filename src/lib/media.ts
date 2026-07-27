import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { v4 as uuidv4 } from 'uuid';

import { calculateImageDisplaySize } from '@/components/nodes/utils';
import { getAttachmentBaseUrl, isWeb } from '@/lib/constant';

type MediaMeta = {
  type: 'image' | 'video';
  width: number;
  height: number;
  duration?: number;
};

export async function getMediaMeta(file: File): Promise<MediaMeta> {
  if (file.type.startsWith('image/')) {
    const bitmap = await createImageBitmap(file);

    const { width, height } = calculateImageDisplaySize(
      bitmap.width,
      bitmap.height,
    );

    bitmap.close();

    return {
      type: 'image',
      width,
      height,
    };
  }

  if (file.type.startsWith('video/')) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');

      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const { width, height } = calculateImageDisplaySize(
          video.videoWidth,
          video.videoHeight,
        );

        resolve({
          type: 'video',
          width,
          height,
          duration: video.duration,
        });

        URL.revokeObjectURL(video.src);
      };

      video.onerror = reject;

      video.src = URL.createObjectURL(file);
    });
  }

  throw new Error(`Unsupported media: ${file.type}`);
}

export async function createAttachmentMessage(
  file: File,
  sender: string,
  receiver: string,
): Promise<IMessage> {
  const now = Date.now();
  if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
    const meta = await getMediaMeta(file);
    const message: IMessage = {
      uuid: uuidv4(),
      type: meta.type,
      content: URL.createObjectURL(file),
      plainContent: meta.type === 'image' ? '[Image]' : '[Video]',
      sender,
      receiver,
      createdAt: now,
      updatedAt: now,
      extra: JSON.stringify({
        width: meta.width,
        height: meta.height,
        duration: meta.duration,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      }),
    };
    return message;
  }

  const message: IMessage = {
    uuid: uuidv4(),
    type: 'file',
    content: '',
    plainContent: `[File]`,
    sender,
    receiver,
    createdAt: now,
    updatedAt: now,
    extra: JSON.stringify({
      name: file.name,
      size: file.size,
      mimeType: file.type,
    }),
  };

  return message;
}

export const MEDIA_MAX_WIDTH = 640;
export const MOBILE_MEDIA_MAX_WIDTH = 240;

export function calculateMediaSize({
  width,
  height,
  isMobile = false,
}: {
  width?: number;
  height?: number;
  isMobile?: boolean;
}) {
  const maxWidth = isMobile ? MOBILE_MEDIA_MAX_WIDTH : MEDIA_MAX_WIDTH;
  const mediaWidth = width ?? maxWidth;
  const mediaHeight = height ?? maxWidth;

  const scale = Math.min(maxWidth / mediaWidth, 640 / mediaHeight, 1);

  return {
    width: mediaWidth * scale,
    height: mediaHeight * scale,
  };
}

export function getMediaUrl(content?: string) {
  if (!content) {
    return '';
  }

  // 本地预览资源
  if (content.startsWith('blob:')) {
    return content;
  }

  // 已上传资源
  return `${getAttachmentBaseUrl()}/${content}`;
}

export async function downloadFile(url: string, fileName?: string) {
  if (isWeb) {
    await downloadInWeb(url, fileName);
  } else {
    await downloadInTauri(url, fileName);
  }
}

async function downloadInWeb(url: string, fileName?: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const blob = await response.blob();

  const blobUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = blobUrl;
  anchor.download = fileName || 'download';

  document.body.appendChild(anchor);

  anchor.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );

  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1000);
}

async function downloadInTauri(url: string, fileName?: string) {
  const filePath = await save({
    defaultPath: fileName,
    filters: [
      {
        name: 'File',
        extensions: [fileName?.split('.').pop() || '*'],
      },
    ],
  });
  if (!filePath) return;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  await writeFile(filePath, uint8Array);
}
