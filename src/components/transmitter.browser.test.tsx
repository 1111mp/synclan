import { useEffect, useState, type ReactNode } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import { Transmitter } from './transmitter';
import { TooltipProvider } from './ui/tooltip';

// Keep the real floating layer, layout and Motion animations; isolate editor services.
vi.mock('@lexical/react/LexicalExtensionComposer', () => ({
  LexicalExtensionComposer: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/components/extensions', () => ({ SynclanEditorExtension: {} }));
vi.mock('@/components/nodes', () => ({ ImageNode: class {} }));
vi.mock('@/hooks', () => ({ useIsMobile: () => false }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/components/plugins', () => ({
  $isEmpty: () => false,
  FixedTextFormatToolbar: () => (
    <div data-testid='format-toolbar'>Formatting</div>
  ),
}));
vi.mock('@/components/transmitter-more-menu', () => ({
  TransmitterMoreMenu: () => <button>More</button>,
}));
vi.mock('@/components', () => ({
  EmojiButton: () => <button>Emoji</button>,
  CompositionInput: ({
    onEmptyChange,
    onLineChange,
    onFocusChange,
    isExpanded,
  }: {
    onEmptyChange: (empty: boolean) => void;
    onLineChange: (multiple: boolean) => void;
    onFocusChange: (focused: boolean) => void;
    isExpanded: boolean;
  }) => {
    const [text, setText] = useState('');
    useEffect(() => {
      onFocusChange(true);
    }, [onFocusChange]);
    return (
      <textarea
        aria-label='Draft'
        value={text}
        style={{
          display: 'block',
          width: '100%',
          height: isExpanded ? '100%' : text.includes('\n') ? 120 : 24,
        }}
        onChange={(event) => {
          setText(event.target.value);
          onEmptyChange(!event.target.value);
          onLineChange(event.target.value.includes('\n'));
        }}
      />
    );
  },
}));

let view: RenderResult | undefined;
afterEach(async () => {
  await view?.unmount();
});

async function fixture() {
  view = await render(
    <TooltipProvider>
      <div
        id='synclan-device-message-list'
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: 700,
          width: 900,
        }}
      >
        <div data-testid='messages' style={{ flex: 1, minHeight: 0 }}>
          Messages
        </div>
        <footer>
          <Transmitter />
        </footer>
      </div>
    </TooltipProvider>,
  );
  return {
    messages: document.querySelector('[data-testid="messages"]') as HTMLElement,
    draft: document.querySelector('textarea') as HTMLTextAreaElement,
    expand: () =>
      document.querySelector(
        '[aria-label="transmitter.expand"]',
      ) as HTMLButtonElement,
    collapse: () =>
      document.querySelector(
        '[aria-label="transmitter.collapse"]',
      ) as HTMLButtonElement,
  };
}

for (const draft of [
  '',
  'A short draft',
  'First line\nSecond line\nThird line',
]) {
  test(`preserves layout and draft through expand/collapse (${draft.length} characters)`, async () => {
    const ui = await fixture();
    if (draft) await view!.getByRole('textbox', { name: 'Draft' }).fill(draft);
    const height = ui.messages.getBoundingClientRect().height;
    ui.expand().click();
    await expect
      .poll(() => document.querySelector('[data-composer-overlay]'))
      .toBeTruthy();
    expect(ui.messages.getBoundingClientRect().height).toBeCloseTo(height, 0);
    expect(
      document.querySelector('[data-testid="format-toolbar"]'),
    ).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 400));
    ui.collapse().click();
    await expect
      .poll(() => ui.expand()?.closest('ul')?.parentElement?.style.opacity)
      .toBe('1');
    await expect
      .poll(() => ui.messages.getBoundingClientRect().height)
      .toBeCloseTo(height, 0);
    expect(ui.draft.value).toBe(draft);
    expect(ui.draft.isConnected).toBe(true);
    expect(document.querySelector('[data-composer-overlay]')).toBeNull();
  });
}

test('can dismiss with the overlay and reopen after an interrupted expansion', async () => {
  const ui = await fixture();
  const height = ui.messages.getBoundingClientRect().height;
  ui.expand().click();
  await expect
    .poll(() => document.querySelector('[data-composer-overlay]'))
    .toBeTruthy();
  const overlay = document.querySelector('[data-composer-overlay]')!;
  overlay.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await expect
    .poll(() => ui.expand()?.closest('ul')?.parentElement?.style.opacity)
    .toBe('1');
  ui.expand().click();
  await expect
    .poll(() => document.querySelector('[data-composer-overlay]'))
    .toBeTruthy();
  ui.collapse().dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
  await expect
    .poll(() => ui.messages.getBoundingClientRect().height)
    .toBeCloseTo(height, 0);
  await expect
    .poll(() => ui.expand()?.closest('ul')?.parentElement?.style.opacity)
    .toBe('1');
});

test('keeps edited draft and layout stable across repeated cycles', async () => {
  const ui = await fixture();
  const originalHeight = ui.messages.getBoundingClientRect().height;
  ui.expand().click();
  await expect
    .poll(() => ui.draft.getBoundingClientRect().height)
    .toBeGreaterThan(200);
  expect(ui.messages.getBoundingClientRect().height).toBeCloseTo(
    originalHeight,
    0,
  );
  await view!
    .getByRole('textbox', { name: 'Draft' })
    .fill('Edited while expanded\nAnother line');
  ui.collapse().click();
  // Content stays visible while the shell shrinks; only controls crossfade.
  expect(getComputedStyle(ui.draft).opacity).toBe('1');
  await expect
    .poll(() => ui.expand()?.closest('ul')?.parentElement?.style.opacity)
    .toBe('1');
  const compactHeight = ui.messages.getBoundingClientRect().height;
  const compactTop = ui.draft.getBoundingClientRect().top;
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(ui.draft.getBoundingClientRect().top).toBeCloseTo(compactTop, 0);
  ui.expand().click();
  await expect
    .poll(() => ui.draft.getBoundingClientRect().height)
    .toBeGreaterThan(200);
  ui.collapse().click();
  await expect
    .poll(() => ui.expand()?.closest('ul')?.parentElement?.style.opacity)
    .toBe('1');
  expect(ui.messages.getBoundingClientRect().height).toBeCloseTo(
    compactHeight,
    0,
  );
  expect(ui.draft.value).toBe('Edited while expanded\nAnother line');
});
