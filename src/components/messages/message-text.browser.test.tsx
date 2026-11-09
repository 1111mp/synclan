import { loadCodeLanguage, loadCodeTheme } from '@lexical/code-shiki';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cleanup, render } from '@testing-library/react';
import {
  $createTextNode,
  $nodesOfType,
  defineExtension,
  getNearestEditorFromDOMNode,
} from 'lexical';
import { StrictMode, createRef, useRef } from 'react';
import { afterEach, expect, test, vi } from 'vitest';

import { SynclanEditorExtension } from '@/components/extensions';
import { CodePlusNode } from '@/components/nodes';

import { TextMessage, type MessageContextMenuRef } from './message-text';

const metrics = vi.hoisted(() => ({
  calls: 0,
  milliseconds: 0,
  last: {} as Record<string, unknown>,
}));
// Keep the real editor, grammar and tokenizer; only instrument the expensive operation.
vi.mock('@lexical/code-shiki', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lexical/code-shiki')>();
  const { $getEditor } = await import('lexical');
  return {
    ...actual,
    ShikiTokenizer: {
      ...actual.ShikiTokenizer,
      $tokenize(...args: Parameters<typeof actual.ShikiTokenizer.$tokenize>) {
        const start = performance.now();
        metrics.calls++;
        metrics.last = {
          editable: $getEditor().isEditable(),
          language: args[1],
          style: args[0].getStyle(),
          types: [
            ...new Set(args[0].getChildren().map((node) => node.getType())),
          ],
        };
        try {
          return actual.ShikiTokenizer.$tokenize.apply(this, args);
        } finally {
          metrics.milliseconds += performance.now() - start;
        }
      },
    },
  };
});
vi.mock('@/components/plugins', async () => ({
  ...(await import('../plugins/code-high-light-shiki-plugin')),
  validateUrlHandle: () => true,
}));
vi.mock('@/components/emoji', () => ({ Emoji: () => null }));
vi.mock('@/lib/utils', async () => import('@/lib/utils/ts-cn'));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function codeMessage(index: number): TextMessage {
  const code = Array.from(
    { length: 80 },
    (_, line) =>
      `const value_${index}_${line}: number = ${line}; // a representative TypeScript line`,
  ).join('\n');
  return {
    uuid: `code-${index}`,
    type: 'text',
    sender: 'other',
    receiver: 'self',
    createdAt: 0,
    updatedAt: 0,
    content: JSON.stringify({
      root: {
        type: 'root',
        version: 1,
        format: '',
        indent: 0,
        direction: null,
        children: [
          {
            type: 'code-plus',
            version: 1,
            format: '',
            indent: 0,
            direction: null,
            language: 'typescript',
            theme: 'one-dark-pro',
            children: [
              {
                type: 'text',
                version: 1,
                text: code,
                format: 0,
                style: '',
                detail: 0,
                mode: 'normal',
              },
            ],
          },
        ],
      },
    }),
  };
}

test('profiles readonly code messages on conversation remount', async () => {
  const loadingStart = performance.now();
  await Promise.all([
    loadCodeLanguage('typescript'),
    loadCodeTheme('one-dark-pro'),
  ]);
  const grammarLoadMs = performance.now() - loadingStart;
  const messages = Array.from({ length: 8 }, (_, index) => codeMessage(index));
  const contents = (
    <StrictMode>
      {messages.map((message) => (
        <TextMessage key={message.uuid} message={message} />
      ))}
    </StrictMode>
  );
  metrics.calls = 0;
  metrics.milliseconds = 0;
  const start = performance.now();
  const view = render(contents);
  await expect.poll(() => document.querySelectorAll('code').length).toBe(8);
  const initial = {
    calls: metrics.calls,
    highlightingMs: metrics.milliseconds,
    mountMs: performance.now() - start,
  };
  expect(initial.calls).toBeGreaterThan(0);
  // Real chat messages are saved after highlighting, including token styles.
  const persistedMessages = messages.map((message, index) => ({
    ...message,
    content: JSON.stringify(
      getNearestEditorFromDOMNode(document.querySelectorAll('code')[index])!
        .getEditorState()
        .toJSON(),
    ),
  }));
  const persistedContents = (
    <StrictMode>
      {persistedMessages.map((message) => (
        <TextMessage key={message.uuid} message={message} />
      ))}
    </StrictMode>
  );
  view.unmount();
  metrics.calls = 0;
  metrics.milliseconds = 0;
  const again = performance.now();
  const persistedView = render(persistedContents);
  await expect.poll(() => document.querySelectorAll('code').length).toBe(8);
  const remount = {
    calls: metrics.calls,
    highlightingMs: metrics.milliseconds,
    mountMs: performance.now() - again,
  };
  persistedView.unmount();
  metrics.calls = 0;
  metrics.milliseconds = 0;
  const returnStart = performance.now();
  render(persistedContents);
  await expect.poll(() => document.querySelectorAll('code').length).toBe(8);
  const repeatReturn = {
    calls: metrics.calls,
    highlightingMs: metrics.milliseconds,
    mountMs: performance.now() - returnStart,
  };
  console.info(
    'Code message profile',
    JSON.stringify({
      messages: 8,
      linesPerMessage: 80,
      grammarLoadMs,
      initial,
      remount,
      repeatReturn,
    }),
  );
  expect(
    remount.calls,
    JSON.stringify({ grammarLoadMs, initial, remount, last: metrics.last }),
  ).toBe(0);
  expect(document.querySelector('code')?.textContent).toContain('value_0_0');
});

function savedCodeMessage(theme: string): TextMessage {
  const message = codeMessage(99);
  const state = JSON.parse(message.content!) as {
    root: { children: Array<Record<string, unknown>> };
  };
  state.root.children[0].theme = theme;
  state.root.children[0].children = [
    {
      type: 'code-highlight',
      version: 1,
      text: 'const answer = 42;',
      style: 'color: #a626a4;',
      format: 0,
      detail: 0,
      mode: 'normal',
    },
  ];
  return { ...message, content: JSON.stringify(state) };
}

test('restores the theme background for older styled messages without parsing their code', async () => {
  await Promise.all([
    loadCodeLanguage('typescript'),
    loadCodeTheme('one-light'),
  ]);
  metrics.calls = 0;
  render(<TextMessage message={savedCodeMessage('one-light')} />);
  await expect
    .poll(() => document.querySelector('code')?.style.backgroundColor)
    .toBeTruthy();
  expect(metrics.calls).toBe(1);
  expect(metrics.last.language).toBe('text');
  expect(document.querySelector('code')?.textContent).toBe(
    'const answer = 42;',
  );
  expect(
    document.querySelector('code span[style]')?.getAttribute('style'),
  ).toContain('166');
});

test('editable code still retokenizes after changes', async () => {
  await Promise.all([
    loadCodeLanguage('typescript'),
    loadCodeTheme('one-dark-pro'),
  ]);
  const message = savedCodeMessage('one-dark-pro');
  const extension = defineExtension({
    name: 'editable-code-regression',
    dependencies: [SynclanEditorExtension],
    $initialEditorState: JSON.parse(message.content!),
    editable: true,
  });
  metrics.calls = 0;
  render(
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <ContentEditable aria-label='Editable code' />
    </LexicalExtensionComposer>,
  );
  await expect.poll(() => metrics.calls).toBeGreaterThan(0);
  const before = metrics.calls;
  const editor = getNearestEditorFromDOMNode(document.querySelector('code')!)!;
  editor.update(
    () => {
      $nodesOfType(CodePlusNode)[0].append(
        $createTextNode('\nconst another = 123;'),
      );
    },
    { discrete: true },
  );
  await expect.poll(() => metrics.calls).toBeGreaterThan(before);
  expect(document.querySelector('code')?.textContent).toContain(
    'const another = 123;',
  );
});

function VirtualCodeList({
  message,
  overscan,
}: {
  message: TextMessage;
  overscan: number;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: 40,
    overscan,
    estimateSize: () => 520,
    getScrollElement: () => viewport.current,
    getItemKey: (index) => index,
    initialRect: { height: 600, width: 900 },
    initialOffset: 40 * 520 - 600,
  });
  return (
    <div ref={viewport} style={{ height: 600, width: 900, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            data-code-index={item.index}
            style={{
              position: 'absolute',
              top: item.start,
              height: 520,
              width: '100%',
              overflow: 'hidden',
            }}
          >
            <TextMessage
              message={{ ...message, uuid: `virtual-${item.index}` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

test('profiles the visible code window with bounded overscan', async () => {
  await Promise.all([
    loadCodeLanguage('typescript'),
    loadCodeTheme('one-dark-pro'),
  ]);
  const prepared = render(<TextMessage message={codeMessage(123)} />);
  await expect.poll(() => document.querySelectorAll('code').length).toBe(1);
  const saved = {
    ...codeMessage(123),
    content: JSON.stringify(
      getNearestEditorFromDOMNode(document.querySelector('code')!)!
        .getEditorState()
        .toJSON(),
    ),
  };
  prepared.unmount();
  const results: Array<{ overscan: number; mounted: number; mountMs: number }> =
    [];
  for (const overscan of [8, 3]) {
    const start = performance.now();
    const view = render(
      <StrictMode>
        <VirtualCodeList message={saved} overscan={overscan} />
      </StrictMode>,
    );
    await expect
      .poll(() => document.querySelector('[data-code-index="39"] code'))
      .toBeTruthy();
    results.push({
      overscan,
      mounted: document.querySelectorAll('code').length,
      mountMs: performance.now() - start,
    });
    view.unmount();
  }
  console.info('Virtual code window profile', JSON.stringify(results));
  expect(results[1].mounted).toBeLessThan(results[0].mounted);
});

test('preserves rich HTML and plain text copying for readonly highlighted messages', async () => {
  await Promise.all([
    loadCodeLanguage('typescript'),
    loadCodeTheme('one-light'),
  ]);
  let copied: ClipboardItem[] = [];
  vi.spyOn(navigator.clipboard, 'write').mockImplementation(async (items) => {
    copied = [...items];
  });
  const ref = createRef<MessageContextMenuRef>();
  render(<TextMessage ref={ref} message={savedCodeMessage('one-light')} />);
  await expect
    .poll(() => document.querySelector('code')?.textContent)
    .toBe('const answer = 42;');
  await ref.current!.onCopy();
  expect(copied).toHaveLength(1);
  expect(await (await copied[0].getType('text/plain')).text()).toContain(
    'const answer = 42;',
  );
  const html = await (await copied[0].getType('text/html')).text();
  expect(html).toContain('<pre');
  expect(html).toContain('color:');
});
