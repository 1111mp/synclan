import { MessageScroller } from '@shadcn/react/message-scroller';
import { useVirtualizer } from '@tanstack/react-virtual';
import { StrictMode, useRef } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import { useInitialConversationScroll } from './use-initial-conversation-scroll';

type Conversation = { id: string; heights: number[] };
let view: RenderResult | undefined;
let strictMode = false;

function Fixture({ id, heights }: Conversation) {
  const viewport = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: heights.length,
    overscan: 8,
    paddingEnd: 16,
    scrollPaddingEnd: 16,
    estimateSize: () => 160,
    getScrollElement: () => viewport.current,
    getItemKey: (index) => `${id}-${index}`,
    anchorTo: 'end',
    followOnAppend: true,
    scrollEndThreshold: 120,
    directDomUpdates: true,
  });
  useInitialConversationScroll(virtualizer, id, heights.length);

  return (
    <MessageScroller.Provider defaultScrollPosition='end'>
      <MessageScroller.Root>
        <MessageScroller.Viewport
          ref={viewport}
          data-conversation={id}
          data-count={heights.length}
          style={{ height: 300, width: 640, overflow: 'auto' }}
        >
          <header style={{ height: 56 }}>Conversation</header>
          <MessageScroller.Content style={{ minHeight: 244 }}>
            <div
              ref={virtualizer.containerRef}
              style={{ position: 'relative' }}
            >
              {virtualizer.getVirtualItems().map((item) => (
                <div
                  key={item.key}
                  ref={virtualizer.measureElement}
                  data-index={item.index}
                  style={{ position: 'absolute', top: 0, width: '100%' }}
                >
                  <MessageScroller.Item
                    messageId={`${id}-${item.index}`}
                    scrollAnchor
                  >
                    <div style={{ height: heights[item.index] }}>
                      {item.index}
                    </div>
                  </MessageScroller.Item>
                </div>
              ))}
            </div>
          </MessageScroller.Content>
        </MessageScroller.Viewport>
      </MessageScroller.Root>
    </MessageScroller.Provider>
  );
}

const text = { id: 'text', heights: Array.from({ length: 30 }, () => 64) };
const media = {
  id: 'media',
  heights: Array.from({ length: 30 }, (_, i) => [640, 80, 420, 60][i % 4]),
};
function viewport() {
  return view!.container.querySelector<HTMLElement>('[data-conversation]')!;
}
function distanceFromEnd() {
  const element = viewport();
  return element.scrollHeight - element.clientHeight - element.scrollTop;
}
async function show(conversation: Conversation) {
  const fixture = <Fixture {...conversation} />;
  const ui = strictMode ? <StrictMode>{fixture}</StrictMode> : fixture;
  if (view) {
    // Preserve the mounted hook across conversation changes.
    await view.rerender(ui);
  } else {
    view = await render(ui);
  }
  await vi.waitFor(() => {
    expect(viewport()?.dataset.conversation).toBe(conversation.id);
    expect(viewport()?.dataset.count).toBe(String(conversation.heights.length));
  });
  // Flush resize observers even when the conversation ID and message count stay unchanged.
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}
async function expectBottom() {
  await vi.waitFor(() =>
    expect(Math.abs(distanceFromEnd())).toBeLessThanOrEqual(1),
  );
}
async function scrollUp() {
  viewport().scrollTop = 0;
  viewport().dispatchEvent(new Event('scroll'));
  await vi.waitFor(() => expect(viewport().scrollTop).toBe(0));
}

beforeEach(() => {
  // vitest-browser-react cleans up the previous render before each test.
  view = undefined;
});

describe.each([false, true])('StrictMode=%s', (strict) => {
  beforeEach(() => {
    strictMode = strict;
  });

  test('switches from scrolled-up text to tall media and back without remounting', async () => {
    await show(text);
    await expectBottom();
    await new Promise((resolve) => setTimeout(resolve, 300));
    await scrollUp();
    await show(media);
    await expectBottom();
    await scrollUp();
    await show(text);
    await expectBottom();
  });

  test('positions messages that arrive after the old 250ms initialization window', async () => {
    await show({ id: 'delayed', heights: [] });
    await new Promise((resolve) => setTimeout(resolve, 350));
    await show({ ...media, id: 'delayed' });
    await expectBottom();
  });

  test('keeps the bottom anchored as a media row grows after loading', async () => {
    await show(text);
    await expectBottom();
    await show({ ...text, heights: [...text.heights.slice(0, -1), 640] });
    await expectBottom();
  });

  test('does not force a reader back to the bottom when another message arrives', async () => {
    await show(text);
    await expectBottom();
    await scrollUp();
    await show({ ...text, heights: [...text.heights, 640] });
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(viewport().scrollTop).toBeLessThanOrEqual(1);
    expect(distanceFromEnd()).toBeGreaterThan(120);
  });
});
