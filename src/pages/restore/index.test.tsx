import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { Component as RestorePage } from './index';

const mocks = vi.hoisted(() => ({
  searchRestoreDevice: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/components/ui', async () => ({
  ...(await import('@/components/ui/avatar')),
  ...(await import('@/components/ui/button')),
  ...(await import('@/components/ui/empty')),
  ...(await import('@/components/ui/field')),
  ...(await import('@/components/ui/input')),
  ...(await import('@/components/ui/radio-group')),
  ...(await import('@/components/ui/spinner')),
}));
vi.mock('@/lib/utils', async () => ({
  ...(await import('@/lib/utils/ts-cn')),
  ...(await import('@/lib/utils/url')),
}));
vi.mock('@/lib/constant', () => ({
  getAttachmentBaseUrl: () => 'https://synclan.test/attachments',
}));
vi.mock('@/lib/device', () => ({
  DEVICE_ID_STORAGE_KEY: '__SYNCLAN_DEVICE_ID__',
}));
vi.mock('@/services/cmd', () => ({
  searchRestoreDevice: mocks.searchRestoreDevice,
}));
vi.mock('react-i18next', async () => {
  const { default: translations } = await import('@/locales/en.json');
  return {
    useTranslation: () => ({
      t: (key: string) =>
        key
          .split('.')
          .reduce<unknown>(
            (value, part) =>
              typeof value === 'object' && value !== null
                ? (value as Record<string, unknown>)[part]
                : undefined,
            translations,
          ) ?? key,
    }),
  };
});

vi.mock('sonner', () => ({ toast: { error: mocks.error } }));
const restoredId = 'fe4a8bcd-98f5-4ffe-afba-f7b758d7c1d4';
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  mocks.searchRestoreDevice.mockResolvedValue([
    { id: restoredId, name: 'My device' },
  ]);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.removeItem('__SYNCLAN_DEVICE_ID__');
});

async function selectUniqueDevice() {
  render(<RestorePage />);
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'My device' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search devices' }));
  await waitFor(() => expect(screen.getByRole('radio')).toBeChecked());
}

test('persists the selected device identity when restoring', async () => {
  await selectUniqueDevice();
  const restoreButton = screen.getByRole('button', {
    name: 'Restore This Device',
  });
  fireEvent.click(restoreButton);
  expect(localStorage.getItem('__SYNCLAN_DEVICE_ID__')).toBe(restoredId);
  expect(restoreButton).toBeDisabled();
});

test('keeps selection available when saving the identity fails', async () => {
  await selectUniqueDevice();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage blocked');
  });
  fireEvent.click(screen.getByRole('button', { name: 'Restore This Device' }));
  expect(mocks.error).toHaveBeenCalledWith(
    'Could not restore this device. Please try again.',
  );
  expect(screen.getByRole('radio')).toBeChecked();
  expect(
    screen.getByRole('button', { name: 'Restore This Device' }),
  ).toBeEnabled();
});
