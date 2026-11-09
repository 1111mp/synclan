import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { SidebarProvider, useSidebar } from './sidebar';

const storageKey = '__SYNCLAN_SIDEBAR_OPEN__';
const mocks = vi.hoisted(() => ({ isMobile: false }));
vi.mock('@/hooks', () => ({ useIsMobile: () => mocks.isMobile }));
vi.mock('@/lib/utils/index', async () => import('@/lib/utils/ts-cn'));

function SidebarControls() {
  const { open, openMobile, toggleSidebar } = useSidebar();
  return (
    <>
      <button
        aria-label='Toggle sidebar'
        aria-expanded={open}
        onClick={toggleSidebar}
      >
        Toggle
      </button>
      <output aria-label='Mobile sidebar'>{String(openMobile)}</output>
    </>
  );
}
function fixture(defaultOpen = true) {
  return render(
    <SidebarProvider defaultOpen={defaultOpen}>
      <SidebarControls />
    </SidebarProvider>,
  );
}

beforeEach(() => {
  mocks.isMobile = false;
  localStorage.removeItem(storageKey);
  document.cookie = 'sidebar_state=; path=/; max-age=0';
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem(storageKey);
  document.cookie = 'sidebar_state=; path=/; max-age=0';
});

test.each([true, false])(
  'restores the saved %s state on the first render',
  (saved) => {
    localStorage.setItem(storageKey, String(saved));
    fixture(!saved);
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-expanded',
      String(saved),
    );
  },
);

test('remembers collapse and expansion across provider remounts', () => {
  const first = fixture();
  fireEvent.click(screen.getByRole('button'));
  expect(localStorage.getItem(storageKey)).toBe('false');
  first.unmount();
  const second = fixture();
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(screen.getByRole('button'));
  expect(localStorage.getItem(storageKey)).toBe('true');
  second.unmount();
  fixture();
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
});

test('persists keyboard toggles', () => {
  fixture();
  fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  expect(localStorage.getItem(storageKey)).toBe('false');
});

test.each([null, 'invalid'])(
  'uses defaultOpen when storage contains %s',
  (stored) => {
    if (stored !== null) localStorage.setItem(storageKey, stored);
    fixture(false);
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  },
);

test('migrates the legacy cookie while giving local storage precedence', () => {
  document.cookie = 'sidebar_state=false; path=/';
  const first = fixture();
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  expect(localStorage.getItem(storageKey)).toBe('false');
  first.unmount();
  localStorage.setItem(storageKey, 'true');
  fixture();
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
});

test('keeps mobile drawer visibility separate from the desktop preference', () => {
  localStorage.setItem(storageKey, 'false');
  mocks.isMobile = true;
  const first = fixture();
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByLabelText('Mobile sidebar')).toHaveTextContent('true');
  expect(localStorage.getItem(storageKey)).toBe('false');
  first.unmount();
  fixture();
  expect(screen.getByLabelText('Mobile sidebar')).toHaveTextContent('false');
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
});

test('continues toggling when browser storage is blocked', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('Blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Blocked');
  });
  fixture();
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
});

test('controlled state overrides the persisted preference', () => {
  localStorage.setItem(storageKey, 'false');
  const onOpenChange = vi.fn();
  render(
    <SidebarProvider open={true} onOpenChange={onOpenChange}>
      <SidebarControls />
    </SidebarProvider>,
  );
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(screen.getByRole('button'));
  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(localStorage.getItem(storageKey)).toBe('true');
});
