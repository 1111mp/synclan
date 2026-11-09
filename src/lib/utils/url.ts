import { localProfileAvatarUrl, PROFILE_AVATAR_GROUPS } from '../avatar';
import { getAttachmentBaseUrl } from '../constant';

const LEGACY_DEFAULT_AVATAR = 'https://ui.shadcn.com/avatars/shadcn.jpg';
const DEFAULT_AVATAR_URL = PROFILE_AVATAR_GROUPS[1].avatars[0].url;

export function resolveResourceUrl(path?: string | null): string {
  // Existing profiles may still store the former remote default avatar URL.
  if (!path || path === LEGACY_DEFAULT_AVATAR) return DEFAULT_AVATAR_URL;

  const preset = PROFILE_AVATAR_GROUPS.map((group) =>
    group.avatars.find((avatar) => avatar.value === path),
  ).find(Boolean);
  if (preset) return preset.url;

  // Previously saved seeds remain renderable after the preset list changes.
  const match = path.match(/^dicebear:(avataaars|marbles):v1:(.+)$/);
  if (match)
    return localProfileAvatarUrl(match[2], match[1] as 'avataaars' | 'marbles');

  return `${getAttachmentBaseUrl()}/${path}`;
}
