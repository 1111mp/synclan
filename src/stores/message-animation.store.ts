import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type MessageAnimationStore = {
  animatedIds: Set<string>;

  add: (id: string) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
};

export const useMessageAnimationStore = create<MessageAnimationStore>()(
  immer((set, get) => ({
    animatedIds: new Set(),

    add: (id) =>
      set((state) => {
        state.animatedIds.add(id);
      }),

    remove: (id) =>
      set((state) => {
        state.animatedIds.delete(id);
      }),

    has: (id) => get().animatedIds.has(id),
  })),
);
