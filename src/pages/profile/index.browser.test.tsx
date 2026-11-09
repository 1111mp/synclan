import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { Component as ProfilePage } from './index';

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
vi.mock('react-i18next', async () => {
  const { default: translations } = await import('@/locales/en.json');
  return {
    useTranslation: () => ({
      t: (key: string, options?: { number: number }) => {
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
          ? value.replace('{{number}}', String(options?.number ?? ''))
          : key;
      },
    }),
  };
});

beforeEach(() => {
  mocks.current.avatar = '';
  mocks.updateDeviceProfile.mockImplementation(async (_id, patch) => ({
    ...mocks.current,
    ...patch,
  }));
});
afterEach(() => {
  cleanup();
  document.documentElement.classList.remove('dark');
});

test.each([
  { width: 390, dark: false },
  { width: 960, dark: true },
])(
  'avatar picker layout and keyboard at $width px',
  async ({ width, dark }) => {
    await page.viewport(width, 900);
    document.documentElement.classList.toggle('dark', dark);
    const { container } = render(
      <div className='h-screen'>
        <ProfilePage />
      </div>,
    );
    await page.getByRole('button', { name: 'Edit' }).click();
    await waitFor(() => {
      const transition = container.querySelector('fieldset[style]')!;
      expect(transition.getBoundingClientRect().height).toBeGreaterThan(200);
    });
    // Wait for the expansion to finish before checking final geometry.
    await expect
      .poll(() =>
        container.querySelector('fieldset[style]')?.getAttribute('style'),
      )
      .not.toContain('height: 0px');
    await expect
      .poll(
        () =>
          [...container.querySelectorAll('[data-slot="avatar-image"]')].length,
      )
      .toBe(17);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(16);
    const labels = radios.map((radio) =>
      radio.closest('[data-avatar-option]')!,
    );
    const columns = width < 600 ? 4 : 8;
    expect(Math.round(labels[0].getBoundingClientRect().top)).toBe(
      Math.round(labels[columns - 1].getBoundingClientRect().top),
    );
    if (columns === 4)
      expect(labels[4].getBoundingClientRect().top).toBeGreaterThan(
        labels[0].getBoundingClientRect().top,
      );
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
    await page.getByRole('radio', { name: /^Avatar 1$/ }).click();
    await userEvent.keyboard('{ArrowRight}');
    expect(
      screen.getByRole('radio', {
        name: /^Avatar 2$/,
      }),
    ).toBeChecked();
    await page.screenshot({
      path: `.vitest/attachments/profile-audit-${width}.png`,
    });
    await page.getByRole('button', { name: 'Done' }).click();
    await expect.poll(() => screen.queryByRole('radiogroup')).toBeNull();
  },
);
