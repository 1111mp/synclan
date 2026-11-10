import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { useMediaLoadState } from './use-media-load-state';

afterEach(() => vi.useRealTimers());

test('loading depends on native events rather than elapsed time', () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useMediaLoadState());
  expect(vi.getTimerCount()).toBe(0);
  act(() => {
    vi.advanceTimersByTime(60000);
  });
  expect(result.current.status).toBe('loading');
  act(() => result.current.onLoad());
  expect(result.current.status).toBe('ready');
});

test('a fast retry failure keeps feedback visible for 600ms', () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useMediaLoadState());
  act(() => result.current.onError());
  act(() => result.current.retry());
  act(() => result.current.onError());
  expect(result.current.status).toBe('retrying');
  act(() => {
    vi.advanceTimersByTime(599);
  });
  expect(result.current.status).toBe('retrying');
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(result.current.status).toBe('error');
});

test('a successful retry cancels the delayed error', () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useMediaLoadState());
  act(() => result.current.onError());
  act(() => result.current.retry());
  act(() => result.current.onError());
  act(() => result.current.onLoad());
  act(() => {
    vi.advanceTimersByTime(20000);
  });
  expect(result.current.status).toBe('ready');
});

test('unmount clears retry feedback timers and remount starts a fresh load', () => {
  vi.useFakeTimers();
  const first = renderHook(() => useMediaLoadState());
  act(() => first.result.current.onError());
  act(() => first.result.current.retry());
  act(() => first.result.current.onError());
  first.unmount();
  expect(vi.getTimerCount()).toBe(0);
  const next = renderHook(() => useMediaLoadState());
  act(() => {
    vi.advanceTimersByTime(60000);
  });
  expect(next.result.current.status).toBe('loading');
  expect(next.result.current.attempt).toBe(0);
});
