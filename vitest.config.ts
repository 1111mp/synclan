/// <reference types="vitest" />

import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    watch: false,
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [
        { browser: process.platform === 'darwin' ? 'webkit' : 'chromium' },
      ],
    },
  },
});
