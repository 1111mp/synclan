/// <reference types="vite/client" />

type Platform =
  | 'aix'
  | 'android'
  | 'darwin'
  | 'freebsd'
  | 'haiku'
  | 'linux'
  | 'openbsd'
  | 'sunos'
  | 'win32'
  | 'cygwin'
  | 'netbsd';
type Architecture =
  | 'arm'
  | 'arm64'
  | 'ia32'
  | 'loong64'
  | 'mips'
  | 'mipsel'
  | 'ppc'
  | 'ppc64'
  | 'riscv64'
  | 's390'
  | 's390x'
  | 'x64';

declare global {
  /**
   * defines in `vite.config.ts`
   */
  const OS_ARCH: Architecture;
  const OS_PLATFORM: Platform;
  const EMOJI_ROOT_PATH: string;
  const __APP_VERSION__: string;

  interface Window {
    __refreshVirtualList?: () => void;
    __SYNCLAN_SERVER_DOMAIN__: string;
  }
}

export {};
