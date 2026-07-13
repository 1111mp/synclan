import { noop } from 'lodash-es';
import { create } from 'zustand';
import type { PersistStorage } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { applyPendingTheme } from '@/lib/utils';
import { getSynclanConfig, patchSynclanConfig } from '@/services/cmd';

type SynclanState = {
  config?: ISynclanConfig;
  updateConfig: (config: ISynclanConfig) => void;
  updateTheme: (theme: AppTheme) => Promise<void>;
};

const storage: PersistStorage<Pick<SynclanState, 'config'>> = {
  getItem: async (_name) => {
    const config = await getSynclanConfig();

    // // apply theme
    // if (isWeb) {
    //   await applyPendingTheme(config.theme);
    // }

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

    await patchSynclanConfig(config);
  },
  removeItem: noop,
};

export const useSynclanStore = create<SynclanState>()(
  persist(
    immer((set) => ({
      config: undefined,

      updateConfig: (config) =>
        set((state) => {
          state.config = config;
        }),
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
