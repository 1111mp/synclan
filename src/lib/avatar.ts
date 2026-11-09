import { Avatar as DicebearAvatar, Style } from '@dicebear/core';
import avataaarsDefinition from '@dicebear/styles/avataaars.json' with { type: 'json' };
import marblesDefinition from '@dicebear/styles/marbles.json' with { type: 'json' };

const avataaarsStyle = new Style(avataaarsDefinition);
const marblesStyle = new Style(marblesDefinition);

type ProfileAvatarStyle = 'avataaars' | 'marbles';

export const DEFAULT_PROFILE_AVATAR_SEED = 'Dalia';

// Match the seeds and order of DiceBear's official preview rows.
// https://www.dicebear.com/styles/avataaars/
const avataaarsSeeds = [
  DEFAULT_PROFILE_AVATAR_SEED,
  'Ina',
  'Carmen',
  'Ella',
  'Byron',
  'Ethan',
  'Alia',
  'Renzo',
];

// https://www.dicebear.com/styles/marbles/
const marblesSeeds = [
  'Diana',
  'Ilaria',
  'Cora',
  'Eli',
  'Boris',
  'Ethan',
  'Alma',
  'Ronan',
];

export const PROFILE_AVATAR_GROUPS = [
  {
    id: 'avataaars',
    label: 'Avataaars',
    avatars: avataaarsSeeds.map((seed) => ({
      value: `dicebear:avataaars:v1:${seed}`,
      url: localProfileAvatarUrl(seed),
    })),
  },
  {
    id: 'marbles',
    label: 'Marbles',
    avatars: marblesSeeds.map((seed) => ({
      value: `dicebear:marbles:v1:${seed}`,
      url: localProfileAvatarUrl(seed, 'marbles'),
    })),
  },
];

export function localProfileAvatarUrl(
  avatarId: string,
  style: ProfileAvatarStyle = 'avataaars',
) {
  if (style === 'marbles') {
    return new DicebearAvatar(marblesStyle, {
      scale: 1.1,
      seed: avatarId,
    }).toDataUri();
  }

  return new DicebearAvatar(avataaarsStyle, {
    backgroundColor: [
      'b6e3f4',
      'c0aede',
      'd1d4f9',
      'ffd5dc',
      'ffdfbf',
      'd9f2d9',
    ],
    seed: avatarId,
  }).toDataUri();
}
