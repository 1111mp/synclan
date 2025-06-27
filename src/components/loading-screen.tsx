import { AnimatePresence, motion } from 'motion/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { TauriDragArea } from './tauri-drag-area';

export function LoadingScreen({ loading = true }: { loading?: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {loading && (
        <motion.div
          className='absolute inset-0 flex justify-center items-center z-50 bg-white dark:bg-gray-95'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <TauriDragArea />
          <div className='w-80 h-80'>
            <DotLottieReact
              autoplay
              loop
              src='../../assets/loading_screen.lottie'
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
