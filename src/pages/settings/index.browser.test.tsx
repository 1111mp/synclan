import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';

import { TooltipProvider } from '@/components/ui/tooltip';

import { Component as SettingsPage } from './index';

const mocks = vi.hoisted(() => ({
  isWeb: false,
  updateConfig: vi.fn(),
  changeLanguage: vi.fn(),
  applyPendingTheme: vi.fn(),
  confirm: vi.fn(async () => false),
  config: {
    theme: 'system',
    locale: 'en',
    auto_check_update: true,
    enable_auto_launch: false,
    enable_silent_start: false,
    http_server_port: 53317,
    enable_encryption: false,
    file_upload_dir:
      '/Users/synclan/Library/Application Support/com.synclan.app/uploads',
    auto_file_clean: 3,
    app_log_level: 'info',
    auto_log_clean: 2,
    app_log_max_size: 128,
    app_log_max_count: 8,
  },
}));

vi.mock('@/components', () => ({ useConfirm: () => mocks.confirm }));
vi.mock('@/components/ui', async () => ({
  ...(await import('@/components/ui/field')),
  ...(await import('@/components/ui/item')),
  ...(await import('@/components/ui/dropdown-menu')),
  ...(await import('@/components/ui/switch')),
  ...(await import('@/components/ui/input-group')),
  ...(await import('@/components/ui/radio-group')),
  ...(await import('@/components/ui/separator')),
  ...(await import('@/components/ui/spinner')),
  ...(await import('@/components/ui/tooltip')),
}));
vi.mock('@/lib/utils', async () => ({
  ...(await import('@/lib/utils/ts-cn')),
  applyPendingTheme: mocks.applyPendingTheme,
}));
vi.mock('@/lib/constant', () => ({
  get isWeb() {
    return mocks.isWeb;
  },
}));
vi.mock('@/stores', () => ({
  useSynclanStore: (selector: (state: typeof mocks) => unknown) =>
    selector(mocks),
  useUpdaterStore: { getState: vi.fn() },
}));
vi.mock('@/services/api', () => ({ getAppVersion: async () => '0.1.4' }));
vi.mock('@/services/cmd', () => ({
  restartApp: vi.fn(),
  exportServerCert: vi.fn(),
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
      i18n: { changeLanguage: mocks.changeLanguage },
    }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isWeb = false;
});
afterEach(() => {
  cleanup();
  document.documentElement.classList.remove('dark');
});

test.each([
  { width: 390, dark: false },
  { width: 1100, dark: true },
])('settings layout and saving at $width px', async ({ width, dark }) => {
  await page.viewport(width, 1000);
  document.documentElement.classList.toggle('dark', dark);
  const { container } = render(
    <div className='h-screen'>
      <TooltipProvider>
        <SettingsPage />
      </TooltipProvider>
    </div>,
  );
  await expect
    .element(page.getByRole('heading', { name: 'Settings', exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole('radio', { name: 'System', exact: true }))
    .toBeChecked();
  await page.getByRole('radio', { name: 'Dark', exact: true }).click();
  await expect
    .poll(() => mocks.updateConfig.mock.calls.at(-1)?.[0]?.theme)
    .toBe('dark');
  expect(mocks.applyPendingTheme).toHaveBeenCalledWith('dark');
  const language = page.getByRole('button', { name: /Language English/ });
  await language.click();
  await expect
    .element(page.getByRole('menuitemradio', { name: 'English', exact: true }))
    .toBeChecked();
  await page
    .getByRole('menuitemradio', { name: 'English', exact: true })
    .click();
  await expect.poll(() => document.querySelector('[role="menu"]')).toBeNull();
  await page
    .getByRole('switch', { name: 'Auto Check for Updates', exact: true })
    .click();
  await expect
    .poll(() => mocks.updateConfig.mock.calls.at(-1)?.[0]?.auto_check_update)
    .toBe(false);
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
  await page.screenshot({
    path: `.vitest/attachments/settings-${width}.png`,
  });
  await page
    .getByRole('spinbutton', { name: 'HTTP Server Port', exact: true })
    .fill('53318');
  await expect
    .poll(() => mocks.updateConfig.mock.calls.at(-1)?.[0]?.http_server_port)
    .toBe(53318);
  await expect.poll(() => mocks.confirm.mock.calls.length).toBeGreaterThan(0);
  container
    .querySelector('form')
    ?.lastElementChild?.lastElementChild?.scrollIntoView({ block: 'end' });
  await page.screenshot({
    path: `.vitest/attachments/settings-bottom-${width}.png`,
  });
});
