import { getAttachmentBaseUrl } from '../constant';

const DEFAULT_AVATARS = ['https://ui.shadcn.com/avatars/shadcn.jpg'];

export function resolveResourceUrl(path?: string | null): string {
  if (!path || DEFAULT_AVATARS.includes(path)) return DEFAULT_AVATARS[0];

  return `${getAttachmentBaseUrl()}/${path}`;
}
