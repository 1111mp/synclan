import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createHtmlPlugin } from 'vite-plugin-html';

const host = process.env.TAURI_DEV_HOST;
const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  root: 'src',
  publicDir: '../public',

  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
    createHtmlPlugin({
      pages: [
        {
          entry: './main.tsx',
          filename: 'index.html',
          template: './index.html',
        },
        {
          entry: './preview/main.tsx',
          filename: 'index.html',
          template: './preview/index.html',
        },
      ],
    }),
    tailwindcss(),
  ],

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        preview: resolve(__dirname, 'src/preview/index.html'),
      },
    },
    emptyOutDir: true,
    outDir: '../dist/ui',
  },

  define: {
    OS_ARCH: `"${process.arch}"`,
    OS_PLATFORM: `"${process.platform}"`,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
}));
