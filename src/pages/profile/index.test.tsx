import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { PROFILE_AVATAR_GROUPS } from '@/lib/avatar';
import { resolveResourceUrl } from '@/lib/utils/url';

import { Component as ProfilePage } from './index';

const PROFILE_AVATARS = PROFILE_AVATAR_GROUPS.flatMap((group) => group.avatars);

const mocks = vi.hoisted(() => ({
  current: { id: 'device-1', name: 'Test device', avatar: '' },
  updateCurrent: vi.fn(),
  updateDeviceProfile: vi.fn(),
  onPickImage: vi.fn(),
  error: vi.fn(),
  openPreview: vi.fn(),
}));

vi.mock('@/components', () => ({
  useImagePreview: () => ({ openPreview: mocks.openPreview }),
}));
vi.mock('@/components/ui', async () => ({
  ...(await import('@/components/ui/avatar')),
  ...(await import('@/components/ui/button')),
  ...(await import('@/components/ui/field')),
  ...(await import('@/components/ui/input')),
  ...(await import('@/components/ui/item')),
  ...(await import('@/components/ui/radio-group')),
}));
vi.mock('@/lib/utils', async () => ({
  ...(await import('@/lib/utils/ts-cn')),
  ...(await import('@/lib/utils/url')),
}));
vi.mock('@/lib/constant', () => ({
  getAttachmentBaseUrl: () => 'https://synclan.test/attachments',
}));
vi.mock('@/stores', () => ({
  useDeviceStore: (selector: (state: typeof mocks) => unknown) =>
    selector(mocks),
}));
vi.mock('@/services/cmd', () => ({
  onPickImage: mocks.onPickImage,
  updateDeviceProfile: mocks.updateDeviceProfile,
}));
vi.mock('sonner', () => ({ toast: { error: mocks.error } }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { number: number }) =>
      options ? `${key} ${options.number}` : key,
  }),
}));

beforeEach(() => {
  // Radix measures its hidden radio inputs; jsdom does not provide layout observers.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('scrollTo', vi.fn());
  vi.clearAllMocks();
  mocks.current.name = 'Test device';
  mocks.current.avatar = '';
  mocks.updateDeviceProfile.mockImplementation(async (_id, patch) => ({
    ...mocks.current,
    ...patch,
  }));
});

afterEach(() => vi.unstubAllGlobals());

test('offers sixteen avatars, resolves legacy defaults locally, and saves a selection', async () => {
  mocks.current.avatar = 'https://ui.shadcn.com/avatars/shadcn.jpg';
  render(<ProfilePage />);
  expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'profile.edit' }));
  expect(screen.getAllByRole('radio')).toHaveLength(16);
  expect(screen.getByRole('group', { name: 'Avataaars' })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: 'Marbles' })).toBeInTheDocument();
  expect(
    screen.getByRole('radio', { name: 'profile.avatarOption 9' }),
  ).toBeChecked();
  expect(resolveResourceUrl(mocks.current.avatar)).toBe(
    PROFILE_AVATAR_GROUPS[1].avatars[0].url,
  );
  expect(resolveResourceUrl(null)).toBe(
    PROFILE_AVATAR_GROUPS[1].avatars[0].url,
  );
  expect(new Set(PROFILE_AVATARS.map((avatar) => avatar.url)).size).toBe(16);
  fireEvent.click(
    screen.getByRole('radio', { name: 'profile.avatarOption 11' }),
  );
  expect(
    screen.getByRole('radio', { name: 'profile.avatarOption 11' }),
  ).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'profile.done' }));
  await waitFor(() =>
    expect(mocks.updateDeviceProfile).toHaveBeenCalledWith('device-1', {
      avatar: PROFILE_AVATARS[10].value,
    }),
  );
  await waitFor(() =>
    expect(mocks.updateCurrent).toHaveBeenCalledWith(
      expect.objectContaining({ avatar: PROFILE_AVATARS[10].value }),
    ),
  );
  expect(resolveResourceUrl(PROFILE_AVATARS[10].value)).toBe(
    PROFILE_AVATARS[10].url,
  );
});

test('can replace a preset with an uploaded image', async () => {
  mocks.current.avatar = PROFILE_AVATARS[1].value;
  mocks.onPickImage.mockResolvedValue('custom/avatar.png');
  render(<ProfilePage />);
  fireEvent.click(screen.getByRole('button', { name: 'profile.edit' }));
  fireEvent.click(screen.getByRole('button', { name: 'profile.uploadAvatar' }));
  await waitFor(() =>
    expect(
      screen.getByRole('radio', { name: 'profile.avatarOption 2' }),
    ).not.toBeChecked(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'profile.done' }));
  await waitFor(() =>
    expect(mocks.updateDeviceProfile).toHaveBeenCalledWith('device-1', {
      avatar: 'custom/avatar.png',
    }),
  );
  expect(resolveResourceUrl('custom/avatar.png')).toBe(
    'https://synclan.test/attachments/custom/avatar.png',
  );
});

test.each(['cancel', 'failure'])(
  'preserves the selection on upload %s',
  async (outcome) => {
    mocks.current.avatar = PROFILE_AVATARS[3].value;
    if (outcome === 'cancel') mocks.onPickImage.mockResolvedValue(null);
    else mocks.onPickImage.mockRejectedValue(new Error('Upload failed'));
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole('button', { name: 'profile.edit' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'profile.uploadAvatar' }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'profile.done' }),
      ).toBeEnabled(),
    );
    expect(
      screen.getByRole('radio', { name: 'profile.avatarOption 4' }),
    ).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'profile.done' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'profile.edit' }),
      ).toBeInTheDocument(),
    );
    expect(mocks.updateDeviceProfile).not.toHaveBeenCalled();
    if (outcome === 'failure')
      expect(mocks.error).toHaveBeenCalledWith('Upload failed');
  },
);

test('shows updated profile data when it arrives after the first render', () => {
  const { container, rerender } = render(<ProfilePage />);
  mocks.current.avatar = PROFILE_AVATARS[5].value;
  mocks.current.name = 'Loaded device';
  rerender(<ProfilePage />);
  expect(screen.getByRole('textbox')).toHaveValue('Loaded device');
  fireEvent.click(container.querySelector('[data-slot="avatar"]')!);
  expect(mocks.openPreview).toHaveBeenCalledWith([PROFILE_AVATARS[5].url], 0);
});

test('can replace an uploaded image with a preset and prevents edits while saving', async () => {
  mocks.current.avatar = 'custom/avatar.png';
  let finishSave!: (device: typeof mocks.current) => void;
  mocks.updateDeviceProfile.mockImplementation(
    () =>
      new Promise((resolve) => {
        finishSave = resolve;
      }),
  );
  render(<ProfilePage />);
  fireEvent.click(screen.getByRole('button', { name: 'profile.edit' }));
  fireEvent.click(
    screen.getByRole('radio', { name: 'profile.avatarOption 1' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'profile.done' }));
  await waitFor(() => expect(mocks.updateDeviceProfile).toHaveBeenCalledOnce());
  expect(screen.getByRole('button', { name: 'profile.done' })).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'profile.uploadAvatar' }),
  ).toBeDisabled();
  expect(screen.getByRole('textbox')).toBeDisabled();
  await act(async () =>
    finishSave({ ...mocks.current, avatar: PROFILE_AVATARS[0].value }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument(),
  );
  expect(mocks.updateDeviceProfile).toHaveBeenCalledWith('device-1', {
    avatar: PROFILE_AVATARS[0].value,
  });
});

test('keeps the draft after a failed save and supports retry', async () => {
  mocks.updateDeviceProfile.mockRejectedValueOnce(new Error('Save failed'));
  render(<ProfilePage />);
  fireEvent.click(screen.getByRole('button', { name: 'profile.edit' }));
  fireEvent.click(
    screen.getByRole('radio', { name: 'profile.avatarOption 5' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'profile.done' }));
  await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Save failed'));
  expect(
    screen.getByRole('radio', { name: 'profile.avatarOption 5' }),
  ).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'profile.done' }));
  await waitFor(() =>
    expect(mocks.updateCurrent).toHaveBeenCalledWith(
      expect.objectContaining({ avatar: PROFILE_AVATARS[4].value }),
    ),
  );
});

test('disables saving and avatar choices while an upload is pending', async () => {
  let finishUpload!: (path: string | null) => void;
  mocks.onPickImage.mockImplementation(
    () =>
      new Promise((resolve) => {
        finishUpload = resolve;
      }),
  );
  render(<ProfilePage />);
  fireEvent.click(screen.getByRole('button', { name: 'profile.edit' }));
  fireEvent.click(screen.getByRole('button', { name: 'profile.uploadAvatar' }));
  expect(screen.getByRole('button', { name: 'profile.done' })).toBeDisabled();
  expect(
    screen.getByRole('radio', { name: 'profile.avatarOption 1' }),
  ).toBeDisabled();
  await act(async () => finishUpload(null));
  expect(screen.getByRole('button', { name: 'profile.done' })).toBeEnabled();
});
