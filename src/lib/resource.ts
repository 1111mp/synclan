import { setWasmUrl } from '@lottiefiles/dotlottie-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { join, resourceDir } from '@tauri-apps/api/path';

import { isWeb } from '@/lib/constant';

let resourceInitPromise: Promise<string> | undefined;
let resourceDirPath: string;

export async function initResources() {
  if (import.meta.env.DEV || isWeb) {
    const absoluteWasmUrl = new URL(
      '/@lottiefiles/dotlottie-web/dotlottie-player.wasm',
      window.location.origin,
    ).href;
    setWasmUrl(absoluteWasmUrl);

    return;
  }

  if (!resourceInitPromise) {
    resourceInitPromise = (async () => {
      const redDir = await resourceDir();
      const path = await join(redDir, 'resources', 'web');
      resourceDirPath = convertFileSrc(path);

      const wasmUrl = `${resourceDirPath}/@lottiefiles/dotlottie-web/dotlottie-player.wasm`;
      setWasmUrl(wasmUrl);

      return resourceDirPath;
    })();
  }

  return resourceInitPromise;
}

let emojiRoot: string = '';
export async function makeEmojiResourcePath(src: string) {
  if (import.meta.env.DEV || isWeb) {
    return `${MODULES_ROOT_PATH}/emoji-datasource-apple/img/apple/64/${src}`;
  }

  if (!emojiRoot) {
    const resDir = await initResources();
    emojiRoot = `${resDir}/emoji-datasource-apple/img/apple/64`;
  }

  return `${emojiRoot}/${src}`;
}
