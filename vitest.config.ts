import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

import packageJson from './package.json' with { type: 'json' };

// Match the desktop WebView engine family where Playwright supports it.
// V8 browser coverage requires Chromium, including on macOS.
const browser =
  process.env.VITEST_BROWSER === 'chromium'
    ? 'chromium'
    : process.platform === 'darwin'
      ? 'webkit'
      : 'chromium';

export default defineConfig({
  root: import.meta.dirname,
  // Match the application's compile-time constants when tests import editor modules.
  define: {
    OS_ARCH: JSON.stringify(process.arch),
    OS_PLATFORM: JSON.stringify(process.platform),
    __APP_VERSION__: JSON.stringify(packageJson.version),
    MODULES_ROOT_PATH: JSON.stringify(''),
  },
  resolve: {
    alias: { '@': resolve(import.meta.dirname, './src') },
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
      reporter: ['text', 'html', 'lcov'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.tauri.test.ts', 'src/**/*.browser.test.ts'],
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          exclude: ['src/**/*.browser.test.tsx', 'src/**/*.tauri.test.tsx'],
          setupFiles: ['./src/test/component-setup.ts'],
        },
      },
      {
        extends: true,
        plugins: [react(), tailwindcss()],
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.{ts,tsx}'],
          setupFiles: ['./src/test/browser-setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser }],
          },
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'tauri',
          environment: 'jsdom',
          include: ['src/**/*.tauri.test.{ts,tsx}'],
          setupFiles: [
            './src/test/component-setup.ts',
            './src/test/tauri-setup.ts',
          ],
        },
      },
    ],
  },
});
