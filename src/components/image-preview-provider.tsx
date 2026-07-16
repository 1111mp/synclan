'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Download from 'yet-another-react-lightbox/plugins/download';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import 'yet-another-react-lightbox/styles.css';

type ImagePreviewContextValue = {
  openPreview: (images: string[], index?: number) => void;
};

const ImagePreviewContext = createContext<ImagePreviewContextValue | null>(
  null,
);

export function ImagePreviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    images: string[];
    index: number;
  }>({
    open: false,
    images: [],
    index: 0,
  });

  const openPreview = useCallback((images: string[], index = 0) => {
    setState({
      open: true,
      images,
      index,
    });
  }, []);

  return (
    <ImagePreviewContext.Provider
      value={{
        openPreview,
      }}
    >
      {children}

      <Lightbox
        open={state.open}
        index={state.index}
        close={() =>
          setState((prev) => ({
            ...prev,
            open: false,
          }))
        }
        slides={state.images.map((src) => ({
          src,
        }))}
        plugins={[Download, Zoom]}
        carousel={{
          finite: true,
        }}
        controller={{
          closeOnBackdropClick: true,
        }}
      />
    </ImagePreviewContext.Provider>
  );
}

export function useImagePreview() {
  const ctx = useContext(ImagePreviewContext);

  if (!ctx) {
    throw new Error('useImagePreview must be used inside ImagePreviewProvider');
  }

  return ctx;
}
