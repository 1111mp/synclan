import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type AppServerState = {
  domain: string;
  updateDomain: (domain: string) => void;
};

export const useAppServerStore = create<AppServerState>()(
  immer((set) => ({
    domain: '',

    updateDomain: (domain) => {
      set((state) => {
        window.__SYNCLAN_SERVER_DOMAIN__ = domain;
        state.domain = domain;
      });
    },
  })),
);
