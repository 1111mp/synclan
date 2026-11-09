import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import WelcomePage from './index';

const mocks = vi.hoisted(() => ({
  config: { theme: 'system' },
  updateTheme: vi.fn(),
  openDiscover: vi.fn(),
  navigate: vi.fn(),
  setActiveConversation: vi.fn(),
  conversations: [] as Array<{
    id: string;
    device: { name: string; avatar?: string };
  }>,
}));

vi.mock('@/components', () => ({
  useDeviceDiscover: () => ({ openDiscover: mocks.openDiscover }),
}));
vi.mock('@/components/ui', async () => ({
  ...(await import('@/components/ui/avatar')),
  ...(await import('@/components/ui/button')),
  ...(await import('@/components/ui/card')),
  ...(await import('@/components/ui/dropdown-menu')),
  ...(await import('@/components/ui/field')),
  ...(await import('@/components/ui/radio-group')),
  ...(await import('@/components/ui/separator')),
}));
vi.mock('@/lib/utils', async () => ({
  ...(await import('@/lib/utils/ts-cn')),
  ...(await import('@/lib/utils/url')),
}));
vi.mock('@/lib/constant', () => ({
  isWeb: true,
  getAttachmentBaseUrl: () => 'https://synclan.test/attachments',
}));
vi.mock('@/stores', () => ({
  useSynclanStore: (selector: (state: typeof mocks) => unknown) =>
    selector(mocks),
  useConversationList: () => mocks.conversations,
  useIMStore: {
    getState: () => ({ setActiveConversation: mocks.setActiveConversation }),
  },
}));
vi.mock('react-router', () => ({ useNavigate: () => mocks.navigate }));
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

beforeEach(() => {
  vi.clearAllMocks();
  mocks.conversations = [];
});
afterEach(() => {
  cleanup();
  document.documentElement.classList.remove('dark');
});

function renderWelcome() {
  return render(
    <div className='flex h-screen flex-col'>
      <WelcomePage />
    </div>,
  );
}

test.each([
  { width: 320, height: 568, dark: true },
  { width: 390, height: 900, dark: false },
  { width: 960, height: 900, dark: true },
])(
  'welcome card layout and actions at $width px',
  async ({ width, height, dark }) => {
    await page.viewport(width, height);
    document.documentElement.classList.toggle('dark', dark);
    renderWelcome();
    await expect
      .element(page.getByRole('radio', { name: 'System', exact: true }))
      .toBeChecked();
    await page.getByRole('radio', { name: 'Dark', exact: true }).click();
    expect(mocks.updateTheme).toHaveBeenCalledWith('dark');
    await page
      .getByRole('button', { name: 'Discover Devices', exact: true })
      .click();
    expect(mocks.openDiscover).toHaveBeenCalledOnce();
    await page
      .getByRole('button', {
        name: 'Select your device to start.',
        exact: true,
      })
      .click();
    await expect
      .element(page.getByText('No devices yet', { exact: true }))
      .toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => document.querySelector('[role="menu"]')).toBeNull();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
    const card = document.querySelector('[data-slot=card]')!;
    expect(getComputedStyle(card).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(card).boxShadow).not.toBe('none');
    const systemLabel = page.getByText('System', { exact: true }).element();
    expect(systemLabel.scrollWidth).toBeLessThanOrEqual(
      systemLabel.clientWidth,
    );
    const discoveryButton = page
      .getByRole('button', { name: 'Discover Devices', exact: true })
      .element();
    expect(discoveryButton.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      height,
    );
    await page.screenshot({ path: `.vitest/attachments/welcome-${width}.png` });
    await page
      .getByRole('button', { name: 'Hide welcome card', exact: true })
      .click();
    await expect
      .poll(() => page.getByText('Welcome back', { exact: true }).query())
      .toBeNull();
    await page
      .getByRole('button', { name: 'Show welcome card', exact: true })
      .click();
    await expect
      .element(page.getByText('Welcome back', { exact: true }))
      .toBeVisible();
  },
);

test('opens an existing conversation from the device menu', async () => {
  mocks.conversations = [{ id: 'device-1', device: { name: 'My phone' } }];
  renderWelcome();
  await page
    .getByRole('button', { name: 'Select your device to start.', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'My phone', exact: true }).click();
  expect(mocks.setActiveConversation).toHaveBeenCalledWith('device-1');
  expect(mocks.navigate).toHaveBeenCalledWith('/devices/device-1');
});
