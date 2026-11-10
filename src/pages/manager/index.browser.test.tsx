import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';

import { Component as ManagePage } from './index';

const mocks = vi.hoisted(() => ({
  current: {
    id: 'local-device-12345678-1234-5678-9012',
    name: 'MacBook Pro',
    role: 'host',
    platform: 'macOS',
    browser: 'Chrome',
  },
  devices: [] as IDevice[],
  getDevices: vi.fn(),
  removeDevice: vi.fn(),
  confirm: vi.fn(),
}));
vi.mock('@/components', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('@/components/ui', async () => ({
  ...(await import('@/components/ui/avatar')),
  ...(await import('@/components/ui/badge')),
  ...(await import('@/components/ui/button')),
  ...(await import('@/components/ui/dropdown-menu')),
  ...(await import('@/components/ui/empty')),
  ...(await import('@/components/ui/field')),
  ...(await import('@/components/ui/spinner')),
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
  getDevices: mocks.getDevices,
  removeDevice: mocks.removeDevice,
}));
vi.mock('react-i18next', async () => {
  const { default: translations } = await import('@/locales/en.json');
  return {
    useTranslation: () => ({
      i18n: { language: 'en' },
      t: (key: string, options?: { name: string }) => {
        const value = key
          .split('.')
          .reduce<unknown>(
            (current, part) =>
              typeof current === 'object' && current !== null
                ? (current as Record<string, unknown>)[part]
                : undefined,
            translations,
          );
        return typeof value === 'string'
          ? value.replace('{{name}}', options?.name ?? '')
          : key;
      },
    }),
  };
});
let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.devices = [
    {
      id: 'remote-device-12345678-1234-5678-9012',
      name: 'Office workstation with a long name',
      role: 'client',
      platform: 'Windows',
      browser: 'Microsoft Edge',
      createdAt: Date.UTC(2026, 10, 9),
      updatedAt: Date.UTC(2026, 10, 9, 6, 20),
    },
    {
      id: 'phone-device-12345678-1234-5678-9012',
      name: 'My iPhone',
      role: 'client',
      platform: 'iOS',
      browser: 'Safari',
      createdAt: Date.UTC(2026, 10, 9),
      updatedAt: Date.UTC(2026, 10, 9, 7, 30),
    },
  ];
  mocks.getDevices.mockImplementation(async () => [...mocks.devices]);
  mocks.removeDevice.mockImplementation(async (id: string) => {
    mocks.devices = mocks.devices.filter((device) => device.id !== id);
  });
  mocks.confirm.mockResolvedValue(false);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
  document.documentElement.classList.remove('dark');
});
function renderManager() {
  return render(
    <div className='h-screen'>
      <QueryClientProvider client={client}>
        <ManagePage />
      </QueryClientProvider>
    </div>,
  );
}

test.each([
  { width: 320, dark: true },
  { width: 390, dark: false },
  { width: 1100, dark: true },
])('manager layout at $width px', async ({ width, dark }) => {
  await page.viewport(width, 950);
  document.documentElement.classList.toggle('dark', dark);
  renderManager();
  await expect
    .element(page.getByRole('heading', { name: 'My iPhone', exact: true }))
    .toBeVisible();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
  expect(
    page
      .getByRole('button', { name: 'Copy Device ID', exact: true })
      .element()
      .getBoundingClientRect().right,
  ).toBeLessThanOrEqual(width);
  await page.screenshot({ path: `.vitest/attachments/manager-${width}.png` });
});

test('requires confirmation before removing a device and refreshes the list', async () => {
  await page.viewport(1000, 950);
  renderManager();
  const actions = page.getByRole('button', {
    name: 'Actions for My iPhone',
    exact: true,
  });
  await actions.click();
  await page.getByRole('menuitem', { name: 'Remove', exact: true }).click();
  await expect.poll(() => mocks.confirm.mock.calls.length).toBe(1);
  expect(mocks.removeDevice).not.toHaveBeenCalled();
  mocks.confirm.mockResolvedValueOnce(true);
  await actions.click();
  await page.getByRole('menuitem', { name: 'Remove', exact: true }).click();
  await expect
    .poll(() => mocks.removeDevice.mock.calls[0]?.[0])
    .toBe('phone-device-12345678-1234-5678-9012');
  await expect
    .poll(() =>
      page.getByRole('heading', { name: 'My iPhone', exact: true }).query(),
    )
    .toBeNull();
});

test('shows an empty state when no devices are known', async () => {
  mocks.devices = [];
  renderManager();
  await expect
    .element(page.getByText('No devices found.', { exact: true }))
    .toBeVisible();
});

test('offers a retry when loading fails', async () => {
  mocks.getDevices.mockRejectedValueOnce(new Error('Offline'));
  renderManager();
  await expect
    .element(page.getByText('Could not load devices', { exact: true }))
    .toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect
    .element(page.getByRole('heading', { name: 'My iPhone', exact: true }))
    .toBeVisible();
});
