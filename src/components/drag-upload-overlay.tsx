import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';

type Props = {
  disabled?: boolean;
  children: ReactNode;
  onDrop?: (files: File[]) => void | Promise<void>;
};

function DragUploadOverlay({ children, disabled, onDrop }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    disabled,

    noClick: true,
    noKeyboard: true,

    multiple: true,

    onDropAccepted(files) {
      void onDrop?.(files);
    },
  });

  return (
    <div {...getRootProps()} className='relative size-full'>
      <input {...getInputProps()} />

      {children}

      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className='bg-primary-foreground/60 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md'
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{
                duration: 0.22,
                ease: 'easeOut',
              }}
              className='border-primary bg-background rounded-xl border-2 border-dashed px-12 py-10 shadow-xl'
            >
              <p className='text-lg font-semibold'>Drop files to send</p>

              <p className='text-muted-foreground mt-2 text-sm'>
                Images, videos and files are supported
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { DragUploadOverlay, type Props as DragUploadOverlayProps };
