import { clearMocks, mockWindows } from '@tauri-apps/api/mocks';
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  mockWindows('main');
  localStorage.clear();
  sessionStorage.clear();
});

// Each test installs its own command responses with mockIPC.
afterEach(() => {
  clearMocks();
});
