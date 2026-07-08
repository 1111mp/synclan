import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type Attachment = {
  file: File;
  lock: boolean;
};

type AttachmentState = {
  attachments: Map<string, Attachment>;

  add: (id: string, file: File) => void;
  remove: (id: string) => void;
  lock: (id: string) => void;
};

export const useAttachmentStore = create<AttachmentState>()(
  immer((set, get) => ({
    attachments: new Map(),

    add: (id, file) => {
      set((state) => {
        state.attachments.set(id, {
          file,
          lock: false,
        });
      });
    },
    remove: (id) => {
      const attachment = get().attachments.get(id);
      console.log('attachment', attachment);
      if (attachment && !attachment.lock) {
        set((state) => {
          state.attachments.delete(id);
        });
      }
    },
    lock: (id) => {
      set((state) => {
        const attachment = state.attachments.get(id);
        if (attachment) {
          attachment.lock = true;
        }
      });
    },
  })),
);
