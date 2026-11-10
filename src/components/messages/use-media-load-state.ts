import { useCallback, useEffect, useRef, useState } from 'react';

export type MediaLoadStatus = 'loading' | 'ready' | 'error' | 'retrying';

export function useMediaLoadState() {
  const [status, setStatus] = useState<MediaLoadStatus>('loading');
  const [attempt, setAttempt] = useState(0);
  const retryStartedAt = useRef<number | null>(null);
  const pendingFailure = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFailure = useCallback(() => {
    if (pendingFailure.current !== null) {
      clearTimeout(pendingFailure.current);
      pendingFailure.current = null;
    }
  }, []);

  const onError = useCallback(() => {
    clearFailure();
    // Cached failures can return immediately. Keep the retry feedback visible
    // briefly instead of flashing back to the idle button in a single frame.
    const remaining =
      retryStartedAt.current === null
        ? 0
        : Math.max(0, 600 - (performance.now() - retryStartedAt.current));
    const fail = () => {
      setStatus('error');
    };
    if (remaining > 0) {
      pendingFailure.current = setTimeout(() => {
        pendingFailure.current = null;
        fail();
      }, remaining);
    } else {
      fail();
    }
  }, [clearFailure]);

  const onLoad = useCallback(() => {
    clearFailure();
    setStatus('ready');
  }, [clearFailure]);

  const retry = () => {
    if (status !== 'error') return;
    clearFailure();
    retryStartedAt.current = performance.now();
    setStatus('retrying');
    setAttempt((value) => value + 1);
  };

  useEffect(() => clearFailure, [clearFailure]);

  return { status, attempt, retry, onLoad, onError };
}
