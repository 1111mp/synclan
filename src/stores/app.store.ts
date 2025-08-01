import { createStore, useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

export type AppState = {
  loading: boolean;
  client?: Client;
  updateLoading: (loading: boolean) => void;
  updateClient: (client: Client) => void;
};

const store = createStore<AppState>()(
  immer((set) => ({
    loading: true,
    client: void 0,
    updateLoading: (loading: boolean) =>
      set((state) => {
        state.loading = loading;
      }),
    updateClient: (client: Client) =>
      set((state) => {
        state.client = { ...client };
      }),
  })),
);

export function useAppStore() {
  const { loading, updateLoading, updateClient } = useStore(
    store,
    useShallow((state) => ({
      loading: state.loading,
      updateLoading: state.updateLoading,
      updateClient: state.updateClient,
    })),
  );

  return {
    loading,
    updateLoading,
    updateClient,
  };
}
