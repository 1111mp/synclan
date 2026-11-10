import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

import { FileMessage } from './message-file';

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/lib/media', () => ({
  downloadFile: mocks.download,
  getMediaUrl: (value: string) => value,
}));
vi.mock('@/lib/utils', async () => import('@/lib/utils/ts-cn'));
vi.mock('@/components/ui', async () => import('@/components/ui/attachment'));
vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
const message = {
  type: 'file',
  content: '/file',
  extra: JSON.stringify({ name: 'archive.zip', size: 1024 }),
} as FileMessage;

test('download stays disabled while pending and cancellation does not show success', async () => {
  let finish!: (value: boolean) => void;
  mocks.download.mockImplementationOnce(
    () =>
      new Promise<boolean>((resolve) => {
        finish = resolve;
      }),
  );
  render(<FileMessage message={message} />);
  fireEvent.click(screen.getByRole('button', { name: 'message.download' }));
  expect(
    screen.getByRole('button', { name: 'message.downloading' }),
  ).toBeDisabled();
  await act(async () => finish(false));
  expect(
    screen.getByRole('button', { name: 'message.download' }),
  ).toBeEnabled();
  expect(mocks.success).not.toHaveBeenCalled();
});

test('pending upload cannot be downloaded', () => {
  render(<FileMessage message={{ ...message, content: '' }} />);
  expect(
    screen.getByRole('button', { name: 'message.download' }),
  ).toBeDisabled();
});
