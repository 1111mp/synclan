import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';

import { AboutSettings } from './about-settings';

const mocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('@/lib/utils', async () => await import('@/lib/utils/ts-cn'));
vi.mock('@/components/ui', async () => ({
  ...(await import('@/components/ui/field')),
  ...(await import('@/components/ui/item')),
  ...(await import('@/components/ui/separator')),
  ...(await import('@/components/ui/spinner')),
}));
vi.mock('sonner', () => ({ toast: mocks }));
vi.mock('@/lib/constant', () => ({ isWeb: true }));
vi.mock('@/services/api', () => ({ getAppVersion: async () => '0.1.4' }));
vi.mock('@/stores', () => ({ useUpdaterStore: {} }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

test('web version row covers the entire card and copies without Clipboard API', async () => {
  await page.viewport(1100, 1000);
  vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(undefined!);
  const copy = vi.spyOn(document, 'execCommand').mockReturnValue(true);
  render(
    <div className='@container w-4xl'>
      <AboutSettings />
    </div>,
  );
  const button = page.getByRole('button', { name: /Synclan/ });
  await expect.element(button).toHaveTextContent('v0.1.4');
  const row = button.element();
  const card = row.closest('[data-slot="field-group"]')!.parentElement!;
  const rowRect = row.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  expect(rowRect.top - cardRect.top).toBeCloseTo(1, 0);
  expect(cardRect.bottom - rowRect.bottom).toBeCloseTo(1, 0);
  expect(cardRect.width - rowRect.width).toBeCloseTo(2, 0);
  await button.click();
  expect(copy).toHaveBeenCalledWith('copy');
  await expect.poll(() => mocks.success.mock.calls.length).toBe(1);
  expect(mocks.success).toHaveBeenCalledWith('settings.about.versionCopied');
});

test('shows an error toast when browser copy fails', async () => {
  vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(undefined!);
  vi.spyOn(document, 'execCommand').mockReturnValue(false);
  render(<AboutSettings />);
  const button = page.getByRole('button', { name: /Synclan/ });
  await expect.element(button).toHaveTextContent('v0.1.4');
  await button.click();
  await expect.poll(() => mocks.error.mock.calls.length).toBe(1);
  expect(mocks.success).not.toHaveBeenCalled();
});
