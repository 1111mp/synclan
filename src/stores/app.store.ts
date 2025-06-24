import { createStore, useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

export type AppState = {
  loading: boolean;
  updateLoading: (loading: boolean) => void;
};

const store = createStore<AppState>()(
  immer((set) => ({
    loading: true,
    updateLoading: (loading: boolean) =>
      set((state) => {
        state.loading = loading;
      }),
  })),
);

export function useAppStore() {
  const { loading, updateLoading } = useStore(
    store,
    useShallow((state) => ({
      loading: state.loading,
      updateLoading: state.updateLoading,
    })),
  );

  return {
    loading,
    updateLoading,
  };
}
