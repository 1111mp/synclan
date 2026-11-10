import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { RichTextExtension } from '@lexical/rich-text';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cleanup, render } from '@testing-library/react';
import { $createParagraphNode, $getRoot, defineExtension } from 'lexical';
import { useRef } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';

import { $createImageNode, ImageNode } from '@/components/nodes/image-node';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ui/message';

import { ImageMessage } from './message-image';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mocks = vi.hoisted(() => ({ preview: vi.fn() }));
vi.mock('@/components', () => ({
  useImagePreview: () => ({ openPreview: mocks.preview }),
}));
vi.mock('@/components/ui', () => ({ ImageResizer: () => null }));
vi.mock('@/lib/utils', async () => import('@/lib/utils/ts-cn'));
vi.mock('@/hooks', () => ({ useIsMobile: () => false }));
vi.mock('@/lib/constant', () => ({
  isWeb: true,
  getAttachmentBaseUrl: () => '',
}));
vi.mock('@/lib/media', async (original) => ({
  ...(await original<typeof import('@/lib/media')>()),
  getMediaUrl: (value: string) => value,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function imageSource(width = 1200, height = 800) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="teal"/></svg>`)}`;
}
const src = imageSource();

function InlineImage({
  width,
  height,
  editable = false,
}: {
  width?: number;
  height?: number;
  editable?: boolean;
}) {
  const extension = defineExtension({
    name: 'image-layout-test',
    namespace: 'image-layout-test',
    dependencies: [RichTextExtension],
    nodes: [ImageNode],
    editable,
    theme: { image: 'editor-image' },
    $initialEditorState: () => {
      $getRoot().append(
        $createParagraphNode().append(
          $createImageNode({
            src: imageSource(width, height),
            altText: 'Landscape',
            width,
            height,
          }),
        ),
      );
    },
  });
  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <ContentEditable />
    </LexicalExtensionComposer>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div id='synclan-device-message-list'>
      <Message className='px-4'>
        <MessageAvatar>
          <div className='size-10' />
        </MessageAvatar>
        <MessageContent>
          <Bubble className='max-w-[90%]'>
            <BubbleContent className='editor-shell overflow-x-auto'>
              {children}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </div>
  );
}

test.each([
  { width: 1200, height: 800 },
  { width: 500, height: 1000 },
  { width: undefined, height: undefined },
])(
  'inline image fits the bubble and preserves ratio: $width x $height',
  async ({ width, height }) => {
    await page.viewport(320, 800);
    const { container } = render(
      <Frame>
        <InlineImage width={width} height={height} />
      </Frame>,
    );
    const image = () =>
      container.querySelector(
        'img[data-synclan-preview-image]',
      ) as HTMLImageElement | null;
    await expect
      .poll(() => image()?.complete && image()!.naturalWidth > 0)
      .toBe(true);
    const assertLayout = () => {
      const bubble = container.querySelector('[data-slot="bubble-content"]')!;
      expect(bubble.scrollWidth).toBeLessThanOrEqual(bubble.clientWidth + 1);
      const rect = image()!.getBoundingClientRect();
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.width / rect.height).toBeCloseTo(
        (width ?? 1200) / (height ?? 800),
        2,
      );
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        window.innerWidth,
      );
    };
    assertLayout();
    const smallWidth = image()!.getBoundingClientRect().width;
    await page.getByRole('img', { name: 'Landscape' }).click();
    expect(mocks.preview).toHaveBeenCalledWith([imageSource(width, height)], 0);
    await page.viewport(1100, 800);
    await expect
      .poll(() => image()!.getBoundingClientRect().width)
      .toBeGreaterThan(smallWidth);
    assertLayout();
    await page.viewport(390, 800);
    assertLayout();
  },
);

test('standalone image respects actual bubble width even outside the mobile breakpoint', async () => {
  await page.viewport(320, 800);
  const { container } = render(
    <Frame>
      <ImageMessage
        message={
          {
            type: 'image',
            content: src,
            extra: JSON.stringify({ width: 1200, height: 800 }),
          } as ImageMessage
        }
      />
    </Frame>,
  );
  const image = container.querySelector('img')!;
  await expect.poll(() => image.complete && image.naturalWidth > 0).toBe(true);
  await page.getByRole('button', { name: 'message.previewImage' }).click();
  expect(mocks.preview).toHaveBeenCalledWith([src], 0);
  const bubble = container.querySelector('[data-slot="bubble-content"]')!;
  expect(bubble.scrollWidth).toBeLessThanOrEqual(bubble.clientWidth + 1);
  const rect = image.getBoundingClientRect();
  expect(rect.width / rect.height).toBeCloseTo(1.5, 2);
});

test('editable images keep their saved resize dimensions', async () => {
  await page.viewport(1100, 800);
  const { container } = render(
    <Frame>
      <InlineImage width={320} height={180} editable />
    </Frame>,
  );
  await expect
    .poll(
      () =>
        container.querySelector<HTMLImageElement>(
          'img[data-synclan-preview-image]',
        )?.complete,
    )
    .toBe(true);
  const image = container.querySelector<HTMLImageElement>(
    'img[data-synclan-preview-image]',
  )!;
  expect(image.style.width).toBe('320px');
  expect(image.style.height).toBe('180px');
});

function VirtualMediaList() {
  const viewport = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: 40,
    overscan: 3,
    estimateSize: () => 220,
    getScrollElement: () => viewport.current,
    getItemKey: (index) => `image-${index}`,
  });
  return (
    <div
      id='synclan-device-message-list'
      ref={viewport}
      style={{ height: 440, width: 300, overflow: 'auto' }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            data-media-row={item.index}
            style={{
              position: 'absolute',
              top: item.start,
              width: '100%',
              height: 220,
            }}
          >
            <ImageMessage
              message={
                {
                  type: 'image',
                  uuid: `image-${item.index}`,
                  content: src,
                  extra: JSON.stringify({ width: 240, height: 160 }),
                } as ImageMessage
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

test('virtual media rows load, unmount offscreen, and load again on return', async () => {
  await page.viewport(390, 800);
  const { container } = render(<VirtualMediaList />);
  const first = () => container.querySelector('[data-media-row="0"]');
  await expect
    .poll(() =>
      first()?.querySelector('[aria-busy]')?.getAttribute('aria-busy'),
    )
    .toBe('false');
  expect(container.querySelector('[data-media-row="39"]')).toBeNull();
  const viewport = container.querySelector('#synclan-device-message-list')!;
  viewport.scrollTop = 35 * 220;
  await expect.poll(() => first()).toBeNull();
  await expect
    .poll(() =>
      container
        .querySelector('[data-media-row="35"] [aria-busy]')
        ?.getAttribute('aria-busy'),
    )
    .toBe('false');
  viewport.scrollTop = 0;
  await expect
    .poll(() =>
      first()?.querySelector('[aria-busy]')?.getAttribute('aria-busy'),
    )
    .toBe('false');
  expect(first()?.querySelector('[role="status"]')).toBeNull();
});
