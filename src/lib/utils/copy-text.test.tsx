import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { copyText } from './copy-text';

beforeEach(() => {
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    writable: true,
    value: () => false,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

test('uses the Clipboard API when available', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  await copyText('0.1.4');
  expect(writeText).toHaveBeenCalledWith('0.1.4');
});

test('copies on HTTP without the Clipboard API and restores focus', async () => {
  vi.stubGlobal('navigator', {});
  const button = document.createElement('button');
  document.body.append(button);
  button.focus();
  const copy = vi.fn(() => {
    expect(document.querySelector('textarea')?.value).toBe('0.1.4');
    return true;
  });
  vi.spyOn(document, 'execCommand').mockImplementation(copy);
  await copyText('0.1.4');
  expect(copy).toHaveBeenCalledWith('copy');
  expect(document.querySelector('textarea')).toBeNull();
  expect(document.activeElement).toBe(button);
});

test('falls back when the API denies access', async () => {
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) },
  });
  vi.spyOn(document, 'execCommand').mockReturnValue(true);
  await expect(copyText('0.1.4')).resolves.toBeUndefined();
});

test('reports failed fallback and cleans up', async () => {
  vi.stubGlobal('navigator', {});
  vi.spyOn(document, 'execCommand').mockReturnValue(false);
  await expect(copyText('0.1.4')).rejects.toThrow('Clipboard copy failed');
  expect(document.querySelector('textarea')).toBeNull();
});
