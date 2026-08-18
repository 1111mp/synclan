import '@/lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';

import './styles/global.css';

import App from '@/app';
import { initResources } from '@/lib/resource';
import { applyTheme } from '@/lib/utils';
import { getAppInitialData } from '@/services/init';

const CHUNK_RELOAD_KEY = 'synclan:chunk-reload';

window.addEventListener('vite:preloadError', (event) => {
  // A running page can still reference a lazy-loaded chunk removed by a newer
  // deployment. Reload once to fetch the latest entry document and chunks.
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;

  event.preventDefault();
  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  window.location.reload();
});

window.addEventListener('load', () => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
});

window.addEventListener('pageshow', (event) => {
  // Navigation from Chrome history can restore an entire old page from the
  // back-forward cache without contacting the server. Reload it so an app
  // deployment cannot leave the user running stale chunks.
  if (event.persisted) {
    window.location.reload();
  }
});

void (async () => {
  const [[config, sysTheme]] = await Promise.all([
    getAppInitialData(),
    initResources(),
  ]);
  // Set the theme in advance to prevent flickering.
  applyTheme(config.theme !== 'system' ? config.theme : sysTheme, false);

  const queryClient = new QueryClient();

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );
})();
