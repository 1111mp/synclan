import { getWebviewWindowTheme } from './api';
import { getSynclanConfig } from './cmd';

declare global {
  interface Window {
    __SYNCLAN_PLATFORM__?: 'tauri';

    __SYNCLAN_INITIAL_SETTINGS__: ISynclanConfig;
    __SYNCLAN_INITIAL_THEME__: AppBaseTheme;
  }
}

/**
 * @description Retrieves initial application data (settings and system theme).
 *
 * - On first load (app startup), it reads data injected via Tauri's initialization_script
 *   to avoid extra IPC calls and prevent UI flicker.
 * - On subsequent reloads, it fetches fresh data via invoke to ensure data consistency.
 *
 * @returns {Promise<[Nvmd.Setting, BaseTheme]>}
 */
export async function getAppInitialData(): Promise<
  [ISynclanConfig, AppBaseTheme]
> {
  /**
   * Indicates whether initialization data has already been used
   * within the current WebView lifecycle.
   *
   * sessionStorage behavior:
   * - Persists across page reloads (F5)
   * - Cleared when the window/app is closed
   */
  const isInitial = sessionStorage.getItem('__SYNCLAN_INITIAL__');
  const hasInitData =
    window.__SYNCLAN_INITIAL_SETTINGS__ && window.__SYNCLAN_INITIAL_THEME__;
  // First load (app just started)
  if (isInitial === 'no' && hasInitData) {
    sessionStorage.setItem('__SYNCLAN_INITIAL__', 'yes');
    return [
      window.__SYNCLAN_INITIAL_SETTINGS__,
      window.__SYNCLAN_INITIAL_THEME__,
    ];
  }

  // Page reload (or subsequent loads)
  const [config, theme] = await Promise.all([
    getSynclanConfig(),
    getWebviewWindowTheme(),
  ]);
  return [config, theme ?? 'light'];
}
