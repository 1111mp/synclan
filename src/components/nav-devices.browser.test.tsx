import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';

import { NavDevices } from './nav-devices';
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
} from './ui/sidebar';
import { TooltipProvider } from './ui/tooltip';

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  deleteConversation: vi.fn(),
}));
vi.mock('@/components/ui', async () => ({
  ...(await import('@/components/ui/avatar')),
  ...(await import('@/components/ui/item')),
  ...(await import('@/components/ui/sidebar')),
}));
vi.mock('@/hooks', () => ({
  useIsMobile: () => false,
  useFormatMessageTime: () => () => '09:41',
}));
vi.mock('@/lib/utils', async () => ({
  ...(await import('@/lib/utils/ts-cn')),
  ...(await import('@/lib/utils/url')),
}));
vi.mock('@/lib/constant', () => ({
  getAttachmentBaseUrl: () => 'https://synclan.test/attachments',
}));
vi.mock('@/stores', () => ({
  useIMStore: (selector: (state: typeof mocks) => unknown) => selector(mocks),
}));
vi.mock('@/services/cmd', () => ({ deleteConversationMessages: vi.fn() }));
vi.mock('./confirm-dialog', () => ({ useConfirm: () => async () => false }));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('react-i18next', async () => {
  const { default: translations } = await import('@/locales/en.json');
  const lookup = (key: string) =>
    key
      .split('.')
      .reduce<unknown>(
        (value, part) =>
          typeof value === 'object' && value !== null
            ? (value as Record<string, unknown>)[part]
            : undefined,
        translations,
      );
  return {
    useTranslation: () => ({
      t: (key: string, options?: { name: string; count: number }) => {
        const value =
          (options?.count
            ? lookup(`${key}_${options.count === 1 ? 'one' : 'other'}`)
            : undefined) ?? lookup(key);
        return typeof value === 'string'
          ? value
              .replace('{{name}}', options?.name ?? '')
              .replace('{{count}}', String(options?.count ?? ''))
          : key;
      },
    }),
  };
});

function conversation(unreadCount: number): IConversations {
  return {
    id: 'phone',
    unreadCount,
    lastAccessed: 0,
    lastMessage: {
      type: 'text',
      uuid: 'preview',
      sender: 'phone',
      receiver: 'self',
      plainContent:
        'A longer message preview that should leave room for the unread badge',
      createdAt: 0,
      updatedAt: 0,
    },
    device: {
      id: 'phone',
      name: 'My phone',
      role: 'client',
      createdAt: 0,
      updatedAt: 0,
    },
  };
}
function Fixture({
  unread,
  initiallyOpen = false,
}: {
  unread: number;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <TooltipProvider>
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <Sidebar variant='floating' collapsible='icon'>
          <SidebarContent>
            <NavDevices
              conversations={[conversation(unread)]}
              onSelectDevice={mocks.select}
            />
          </SidebarContent>
        </Sidebar>
        <div className='ml-80'>
          <SidebarTrigger />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  document.documentElement.classList.remove('dark');
  localStorage.removeItem('__SYNCLAN_SIDEBAR_OPEN__');
});

test.each(['light', 'dark'])(
  'shows incoming unread counts on the collapsed avatar in %s mode',
  async (theme) => {
    await page.viewport(1000, 700);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const view = render(<Fixture unread={0} />);
    expect(
      document.querySelector('[data-slot="sidebar-avatar-unread"]'),
    ).toBeNull();
    view.rerender(<Fixture unread={3} />);
    const button = page.getByRole('button', {
      name: 'My phone, 3 unread messages',
      exact: true,
    });
    await expect.element(button).toBeVisible();
    const badge = document.querySelector(
      '[data-slot="sidebar-avatar-unread"]',
    )!;
    expect(getComputedStyle(badge).display).not.toBe('none');
    expect(badge.textContent).toBe('3');
    const target = button.element().getBoundingClientRect();
    const count = badge.getBoundingClientRect();
    expect(count.top).toBeGreaterThanOrEqual(target.top);
    expect(count.right).toBeLessThanOrEqual(target.right);
    await page.screenshot({
      element: document.querySelector('[data-slot="sidebar"]')!,
      path: `.vitest/attachments/unread-${theme}.png`,
    });
    await button.click();
    expect(mocks.select).toHaveBeenCalledWith('phone');
    view.rerender(<Fixture unread={0} />);
    expect(
      document.querySelector('[data-slot="sidebar-avatar-unread"]'),
    ).toBeNull();
    await expect
      .element(page.getByRole('button', { name: 'My phone', exact: true }))
      .toBeVisible();
  },
);

test('caps the badge at 99+ and retains the full count in its accessible name', async () => {
  await page.viewport(1000, 700);
  render(<Fixture unread={120} />);
  await expect
    .element(
      page.getByRole('button', {
        name: 'My phone, 120 unread messages',
        exact: true,
      }),
    )
    .toBeVisible();
  const badge = document.querySelector('[data-slot="sidebar-avatar-unread"]')!;
  expect(badge.textContent).toBe('99+');
  const button = page
    .getByRole('button', { name: 'My phone, 120 unread messages', exact: true })
    .element();
  expect(badge.getBoundingClientRect().right).toBeLessThanOrEqual(
    button.getBoundingClientRect().right,
  );
});

test('switches between expanded and avatar badges without losing the unread count', async () => {
  await page.viewport(1000, 700);
  render(<Fixture unread={1} initiallyOpen />);
  const compact = document.querySelector(
    '[data-slot="sidebar-avatar-unread"]',
  )!;
  const expanded = document.querySelector('[data-slot="sidebar-menu-badge"]')!;
  expect(getComputedStyle(compact).display).toBe('none');
  expect(getComputedStyle(expanded).display).not.toBe('none');
  await page
    .getByRole('button', { name: 'Toggle Sidebar', exact: true })
    .click();
  await expect.poll(() => getComputedStyle(compact).display).not.toBe('none');
  expect(getComputedStyle(expanded).display).toBe('none');
  await expect
    .element(
      page.getByRole('button', {
        name: 'My phone, 1 unread message',
        exact: true,
      }),
    )
    .toBeVisible();
  await page
    .getByRole('button', { name: 'Toggle Sidebar', exact: true })
    .click();
  await expect.poll(() => getComputedStyle(compact).display).toBe('none');
  expect(getComputedStyle(expanded).display).not.toBe('none');
});

test.each(['light', 'dark'])(
  'expanded unread capsule matches the avatar badge in %s mode',
  async (theme) => {
    await page.viewport(1000, 700);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    render(<Fixture unread={120} initiallyOpen />);
    const compact = document.querySelector(
      '[data-slot="sidebar-avatar-unread"]',
    )!;
    const expanded = document.querySelector(
      '[data-slot="sidebar-menu-badge"]',
    )!;
    const preview = document.querySelector('[data-slot="item-description"]')!;
    expect(expanded.textContent).toBe('99+');
    expect(getComputedStyle(expanded).backgroundColor).toBe(
      getComputedStyle(compact).backgroundColor,
    );
    expect(getComputedStyle(expanded).color).toBe(
      getComputedStyle(compact).color,
    );
    expect(preview.getBoundingClientRect().right).toBeLessThanOrEqual(
      expanded.getBoundingClientRect().left,
    );
    await page.screenshot({
      element: document.querySelector('[data-slot="sidebar"]')!,
      path: `.vitest/attachments/unread-expanded-${theme}.png`,
    });
  },
);
