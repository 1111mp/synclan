import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react';
import { AnimatePresence, motion } from 'motion/react';

const absoluteWasmUrl = new URL(
  '/@lottiefiles/dotlottie-web/dotlottie-player.wasm',
  window.location.origin,
).href;
setWasmUrl(absoluteWasmUrl);

export function LoadingScreen({ loading = true }: { loading?: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {loading && (
        <motion.div
          className='bg-background absolute inset-0 z-50 flex items-center justify-center'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className='fixed top-0 h-7 w-full' data-tauri-drag-region />
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
