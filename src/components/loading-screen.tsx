import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { TauriDragArea } from './tauri-drag-area';

export function LoadingScreen() {
  return (
    <div className='absolute inset-0 flex justify-center items-center z-50 bg-white dark:bg-gray-95'>
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
    </div>
  );
}
