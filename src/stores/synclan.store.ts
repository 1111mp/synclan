import { noop } from 'lodash-es';
import { create } from 'zustand';
import type { PersistStorage } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { i18n } from '@/lib/i18n';
import { applyPendingTheme } from '@/lib/utils';
import { getSynclanConfig, patchSynclanConfig } from '@/services/cmd';

type SynclanState = {
  config?: ISynclanConfig;
  updateConfig: (patch: Partial<ISynclanConfig>) => Promise<void>;
  updateTheme: (theme: AppTheme) => Promise<void>;
};

let previousConfig: ISynclanConfig | null = null;
let updateConfigPromiseResolver:
  | ((value: void | PromiseLike<void>) => void)
  | null = null;

const storage: PersistStorage<Pick<SynclanState, 'config'>> = {
  getItem: async (_name) => {
    const config = await getSynclanConfig();

    previousConfig = structuredClone(config);

    if (config.locale) {
      void i18n.changeLanguage(config.locale);
    }

    return {
      state: {
        config,
      },
      version: 0,
    };
  },
  setItem: async (_name, value) => {
    const config = value.state.config;
    if (!config) return;

    if (!previousConfig) {
      previousConfig = structuredClone(config);
      return;
    }

    const patch = createConfigPatch(previousConfig, config);

    if (Object.keys(patch).length === 0) {
      return;
    }

    await patchSynclanConfig(patch);

    previousConfig = structuredClone(config);

    updateConfigPromiseResolver?.();

    updateConfigPromiseResolver = null;
  },
  removeItem: noop,
};

export const useSynclanStore = create<SynclanState>()(
  persist(
    immer((set) => ({
      config: undefined,

      updateConfig: async (patch) => {
        set((state) => {
          if (!state.config) {
            return;
          }

          Object.assign(state.config, patch);
        });

        await new Promise<void>((resolve) => {
          updateConfigPromiseResolver = resolve;
        });
      },
      updateTheme: async (theme) => {
        set((state) => {
          if (state.config) {
            state.config.theme = theme;
          }
        });

        await applyPendingTheme(theme);
      },
    })),
    {
      name: 'synclan-store',
      storage,
    },
  ),
);

/**
 * Create config patch
 *
 * Only return changed fields.
 */
function createConfigPatch(
  oldConfig: ISynclanConfig,
  newConfig: ISynclanConfig,
): Partial<ISynclanConfig> {
  const patch: Partial<ISynclanConfig> = {};

  for (const key of Object.keys(newConfig) as Array<keyof ISynclanConfig>) {
    if (oldConfig[key] !== newConfig[key]) {
      patch[key] = newConfig[key] as never;
    }
  }

  return patch;
}
