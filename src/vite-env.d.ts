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
  declare const OS_ARCH: Architecture;
  declare const OS_PLATFORM: Platform;
  declare const EMOJI_ROOT_PATH: string;
}

export {};
