import { useEffect } from 'react';

import { isWeb } from '@/lib/constant';
import { applyTheme } from '@/lib/utils';
import { getCurrent } from '@/services/api';
import { useSynclanStore } from '@/stores';

export function useTheme() {
  const theme = useSynclanStore((s) => s.config?.theme);

  useEffect(() => {
    if (theme !== 'system') return;

    const unlisten = listenSystemTheme((theme) => {
      applyTheme(theme);
    });

    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [theme]);
}

function listenSystemTheme(callback: (theme: AppBaseTheme) => void) {
  if (!isWeb) {
    return getCurrent().onThemeChanged((e) => {
      callback(e.payload as AppBaseTheme);
    });
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  media.addEventListener('change', handler);
  return Promise.resolve(() => {
    media.removeEventListener('change', handler);
  });
}
