import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { Component as RestorePage } from './index';

const mocks = vi.hoisted(() => ({ searchRestoreDevice: vi.fn() }));
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
const devices = [
  { id: 'fe4a8bcd-98f5-4ffe-afba-f7b758d7c1d4', name: 'MacBook Pro' },
  {
    id: '6ba3f858-d039-472f-b64d-d5aacb6018c0',
    name: 'My iPhone with a longer name',
  },
];
beforeEach(() => {
  vi.clearAllMocks();
  mocks.searchRestoreDevice.mockResolvedValue(devices);
});
afterEach(() => {
  cleanup();
  document.documentElement.classList.remove('dark');
});
function renderRestore() {
  return render(
    <div className='h-screen'>
      <RestorePage />
    </div>,
  );
}

test.each([
  { width: 320, dark: true },
  { width: 390, dark: false },
  { width: 1100, dark: true },
])('restoration layout and selection at $width px', async ({ width, dark }) => {
  await page.viewport(width, 950);
  document.documentElement.classList.toggle('dark', dark);
  renderRestore();
  await expect
    .element(page.getByRole('button', { name: 'Search devices', exact: true }))
    .toBeDisabled();
  await page.screenshot({
    path: `.vitest/attachments/restore-search-${width}.png`,
  });
  await page
    .getByRole('textbox', { name: 'Device ID or Name', exact: true })
    .fill('  Mac  ');
  await page
    .getByRole('button', { name: 'Search devices', exact: true })
    .click();
  expect(mocks.searchRestoreDevice).toHaveBeenCalledWith('Mac');
  await expect
    .element(
      page.getByRole('button', { name: 'Restore This Device', exact: true }),
    )
    .toBeDisabled();
  const radios = page.getByRole('radio').elements();
  expect(radios).toHaveLength(2);
  await page.elementLocator(radios[0]).click();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(page.elementLocator(radios[1])).toBeChecked();
  await expect
    .element(
      page.getByRole('button', { name: 'Restore This Device', exact: true }),
    )
    .toBeEnabled();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
  await page.screenshot({
    path: `.vitest/attachments/restore-results-${width}.png`,
  });
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect
    .element(
      page.getByRole('textbox', { name: 'Device ID or Name', exact: true }),
    )
    .toHaveValue('  Mac  ');
});

test('automatically selects a unique result', async () => {
  mocks.searchRestoreDevice.mockResolvedValue([devices[0]]);
  renderRestore();
  await page.getByRole('textbox').fill('MacBook');
  await userEvent.keyboard('{Enter}');
  await expect.element(page.getByRole('radio')).toBeChecked();
  await expect
    .element(
      page.getByRole('button', { name: 'Restore This Device', exact: true }),
    )
    .toBeEnabled();
});

test('empty results offer a way back to search', async () => {
  mocks.searchRestoreDevice.mockResolvedValue([]);
  renderRestore();
  await page.getByRole('textbox').fill('Unknown');
  await page
    .getByRole('button', { name: 'Search devices', exact: true })
    .click();
  await expect
    .element(page.getByText('No Device Found', { exact: true }))
    .toBeVisible();
  expect(
    page
      .getByRole('button', { name: 'Restore This Device', exact: true })
      .query(),
  ).toBeNull();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect.element(page.getByRole('textbox')).toBeVisible();
});

test('shows search errors inline and supports retry', async () => {
  mocks.searchRestoreDevice.mockRejectedValueOnce(
    new Error('Network unavailable'),
  );
  renderRestore();
  await page.getByRole('textbox').fill('MacBook');
  await page
    .getByRole('button', { name: 'Search devices', exact: true })
    .click();
  await expect
    .element(page.getByText('Network unavailable', { exact: true }))
    .toBeVisible();
  await page
    .getByRole('button', { name: 'Search devices', exact: true })
    .click();
  await expect.element(page.getByRole('radiogroup')).toBeVisible();
});
