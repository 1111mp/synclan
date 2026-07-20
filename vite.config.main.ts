import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, normalizePath } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import { viteStaticCopy } from 'vite-plugin-static-copy';

import packageJson from './package.json';

const host = process.env.TAURI_DEV_HOST;
const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
  root: 'src',
  publicDir: '../public',

  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    createHtmlPlugin(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(
            resolve(
              __dirname,
              'node_modules/emoji-datasource-apple/img/apple/64/**/*',
            ),
          ),
          dest: 'emoji-datasource-apple/img/apple/64/',
          rename: {
            stripBase: true,
          },
        },
        {
          src: normalizePath(
            resolve(
              __dirname,
              'node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm',
            ),
          ),
          dest: '@lottiefiles/dotlottie-web/',
          rename: {
            stripBase: true,
          },
        },
      ],
    }),
  ],

  build: {
    emptyOutDir: true,
    outDir: '../dist/ui',
  },

  define: {
    OS_ARCH: `"${process.arch}"`,
    OS_PLATFORM: `"${process.platform}"`,
    __APP_VERSION__: JSON.stringify(packageJson.version),
    EMOJI_ROOT_PATH:
      mode === 'production'
        ? `""`
        : `"/@fs/${normalizePath(resolve(__dirname, 'node_modules'))}"`,
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
