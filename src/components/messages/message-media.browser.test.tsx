import { fireEvent, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';

import { Bubble, BubbleContent } from '@/components/ui/bubble';

import { MessageExpandable } from './message-expandable';
import { ImageMessage } from './message-image';
import { VideoMessage } from './message-video';

vi.mock('@/components', () => ({
  useImagePreview: () => ({ openPreview: vi.fn() }),
}));
vi.mock('@/hooks', () => ({ useIsMobile: () => false }));
vi.mock('@/lib/utils', async () => import('@/lib/utils/ts-cn'));
vi.mock('@/lib/media', async (original) => ({
  ...(await original<typeof import('@/lib/media')>()),
  getMediaUrl: (value: string) => value,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'message.videoFailed': 'Video unavailable',
        'message.imageFailed': 'Image unavailable',
        'message.mediaRecoveryHint':
          'Check your connection and retry, or ask the sender to resend.',
      })[key] || key,
  }),
}));
afterEach(() => {
  cleanup();
  document.documentElement.classList.remove('dark');
});

test('video fits a narrow bubble and retains its aspect ratio', async () => {
  await page.viewport(320, 800);
  const { container } = render(
    <Bubble variant='outline' className='max-w-[90%]'>
      <BubbleContent className='p-0'>
        <VideoMessage
          message={
            {
              type: 'video',
              extra: JSON.stringify({ width: 1200, height: 800 }),
            } as VideoMessage
          }
        />
      </BubbleContent>
    </Bubble>,
  );
  const bubble = container.querySelector('[data-slot="bubble-content"]')!;
  const video = container.querySelector('video')!;
  expect(bubble.scrollWidth).toBeLessThanOrEqual(bubble.clientWidth + 1);
  const rect = video.getBoundingClientRect();
  expect(rect.width).toBeGreaterThan(0);
  expect(rect.width / rect.height).toBeCloseTo(1.5, 1);
  fireEvent.loadedMetadata(video);
  expect(
    container.querySelector('[aria-busy]')?.getAttribute('aria-busy'),
  ).toBe('false');
  fireEvent.error(video);
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    'Video unavailable',
  );
});

test('failed images expose a keyboard-accessible retry and disable preview', async () => {
  const { container } = render(
    <ImageMessage
      message={
        {
          type: 'image',
          content: '/missing-test-image',
          extra: JSON.stringify({
            width: 400,
            height: 300,
            name: 'shared-photo.png',
          }),
        } as ImageMessage
      }
    />,
  );
  fireEvent.error(container.querySelector('img')!);
  expect(
    container.querySelector<HTMLButtonElement>(
      '[aria-label="message.previewImage"]',
    )?.disabled,
  ).toBe(true);
  const panel = container.querySelector('[role="status"]');
  expect(panel?.textContent).toContain('shared-photo.png');
  expect(panel?.textContent).toContain('Check your connection');
  const bounds = panel!.getBoundingClientRect();
  await page.getByRole('button', { name: 'message.retry' }).click();
  expect(container.querySelector('[role="status"]')).toBe(panel);
  expect(container.querySelector('[data-slot="skeleton"]')).toBeNull();
  expect(
    container.querySelector<HTMLButtonElement>('[role="status"] button')
      ?.disabled,
  ).toBe(true);
  fireEvent.error(container.querySelector('img')!);
  expect(container.querySelector('[role="status"]')).toBe(panel);
  expect(
    container.querySelector('[aria-busy]')?.getAttribute('aria-busy'),
  ).toBe('true');
  await expect
    .poll(
      () =>
        container.querySelector<HTMLButtonElement>('[role="status"] button')
          ?.disabled,
    )
    .toBe(false);
  expect(panel!.getBoundingClientRect().height).toBe(bounds.height);
  await page.getByRole('button', { name: 'message.retry' }).click();
  expect(
    container.querySelector('[aria-busy]')?.getAttribute('aria-busy'),
  ).toBe('true');
  fireEvent.load(container.querySelector('img')!);
  expect(
    container.querySelector<HTMLButtonElement>(
      '[aria-label="message.previewImage"]',
    )?.disabled,
  ).toBe(false);
});

test.each([false, true])(
  'long message controls in both themes (code: %s)',
  async (hasCode) => {
    await page.viewport(390, 800);
    const { container } = render(
      <Bubble variant='muted'>
        <BubbleContent>
          <MessageExpandable maxHeight={100}>
            <div style={{ height: 240 }}>
              {hasCode ? <code>const answer = 42;</code> : 'Long message'}
            </div>
          </MessageExpandable>
        </BubbleContent>
      </Bubble>,
    );
    await expect
      .poll(() => container.querySelector('[aria-expanded]'))
      .toBeTruthy();
    const button =
      container.querySelector<HTMLButtonElement>('[aria-expanded]')!;
    const content = document.getElementById(
      button.getAttribute('aria-controls')!,
    )!;
    if (hasCode) {
      expect(button.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        content.getBoundingClientRect().bottom,
      );
      expect(container.querySelector('[aria-hidden]')).toBeTruthy();
    } else {
      expect(button.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        content.getBoundingClientRect().bottom,
      );
    }
    await page.getByRole('button', { name: 'message.expand' }).click();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(content.clientHeight).toBe(240);
    document.documentElement.classList.add('dark');
    // Let the existing button color transition settle before visual capture.
    const reference = document.createElement('span');
    reference.style.color = 'var(--secondary-foreground)';
    document.body.append(reference);
    await expect
      .poll(() => getComputedStyle(button).color)
      .toBe(getComputedStyle(reference).color);
    reference.remove();
    await page.screenshot({ path: '.vitest/synclan-message-dark.png' });
    await page.getByRole('button', { name: 'message.collapse' }).click();
    expect(content.clientHeight).toBe(100);
    document.documentElement.classList.remove('dark');
    await page.screenshot({ path: '.vitest/synclan-message-light.png' });
  },
);
