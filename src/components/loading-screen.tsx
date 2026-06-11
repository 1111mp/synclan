import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { AnimatePresence, motion } from 'motion/react';

import { TauriDragArea } from './tauri-drag-area';

export function LoadingScreen({ loading = false }: { loading?: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {loading && (
        <motion.div
          className='bg-background absolute inset-0 z-50 flex items-center justify-center'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <TauriDragArea />
          <div className='h-80 w-80'>
            <DotLottieReact
              autoplay
              loop
              src='/images/loading_screen.lottie'
              renderConfig={{
                autoResize: true,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
