import { noop } from 'lodash-es';
import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { getServerDomain } from '@/services/cmd';

type AppServerState = {
  domain: string;
  updateDomain: (domain: string) => void;
};

const storage: PersistStorage<Pick<AppServerState, 'domain'>> = {
  getItem: async (_name) => {
    const domain = await getServerDomain();
    return {
      state: {
        domain,
      },
      version: 0,
    };
  },
  setItem: noop,
  removeItem: noop,
};

export const useAppServerStore = create<AppServerState>()(
  persist(
    immer((set) => ({
      domain: '',

      updateDomain: (domain) => {
        set((state) => {
          state.domain = domain;
        });
      },
    })),
    {
      name: 'app-server-store',
      storage,
    },
  ),
);
