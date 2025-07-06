import { startTransition, useEffect, useState } from 'react';
import { QRCodeDialog } from '@/components';
import { Menu, SquarePen } from 'lucide-react';
import { useMove } from 'react-aria';
import {
  cn,
  getNavSidebarWidthBreakpoint,
  getWidthFromPreferredWidth,
  MAX_WIDTH,
  MIN_FULL_WIDTH,
  MIN_WIDTH,
  WidthBreakpoint,
} from '@/lib/utils';

export type NavSidebarProps = Readonly<{
  children: React.ReactNode;
  preferredLeftPaneWidth?: number;
  requiresFullWidth?: boolean;
  savePreferredLeftPaneWidth?: (width: number) => void;
}>;

enum DragState {
  INITIAL,
  DRAGGING,
  DRAGEND,
}

export function NavSidebar({
  children,
  preferredLeftPaneWidth = MIN_FULL_WIDTH,
  requiresFullWidth = false,
  savePreferredLeftPaneWidth,
}: NavSidebarProps) {
  const [dragState, setDragState] = useState(DragState.INITIAL);

  const [preferredWidth, setPreferredWidth] = useState(() => {
    return getWidthFromPreferredWidth(preferredLeftPaneWidth, {
      requiresFullWidth,
    });
  });

  const width = getWidthFromPreferredWidth(preferredWidth, {
    requiresFullWidth,
  });

  const widthBreakpoint = getNavSidebarWidthBreakpoint(width);

  // `useMove` gives us keyboard and mouse dragging support.
  const { moveProps } = useMove({
    onMoveStart() {
      setDragState(DragState.DRAGGING);
    },
    onMoveEnd() {
      setDragState(DragState.DRAGEND);
    },
    onMove(event) {
      const { shiftKey, pointerType } = event;
      const deltaX = event.deltaX;
      const isKeyboard = pointerType === 'keyboard';
      const increment = isKeyboard && shiftKey ? 10 : 1;
      startTransition(() => {
        setPreferredWidth((prevWidth) => {
          // Jump minimize for keyboard users
          if (isKeyboard && prevWidth === MIN_FULL_WIDTH && deltaX < 0) {
            return MIN_WIDTH;
          }
          // Jump maximize for keyboard users
          if (isKeyboard && prevWidth === MIN_WIDTH && deltaX > 0) {
            return MIN_FULL_WIDTH;
          }
          return prevWidth + deltaX * increment;
        });
      });
    },
  });

  // TODO rewrite with `useEffectEvent`
  // https://react.dev/learn/separating-events-from-effects
  useEffect(() => {
    // Save the preferred width when the drag ends. We can't do this in onMoveEnd
    // because the width is not updated yet.
    if (dragState === DragState.DRAGEND) {
      startTransition(() => {
        setPreferredWidth(width);
        savePreferredLeftPaneWidth?.(width);
        setDragState(DragState.INITIAL);
      });
    }
  }, [
    dragState,
    preferredLeftPaneWidth,
    preferredWidth,
    savePreferredLeftPaneWidth,
    width,
  ]);

  useEffect(() => {
    // This effect helps keep the pointer `col-resize` even when you drag past the handle.
    const className = 'cursor-col-resize';
    if (dragState === DragState.DRAGGING) {
      document.body.classList.add(className);
      return () => {
        document.body.classList.remove(className);
      };
    }
    return undefined;
  }, [dragState]);

  return (
    <aside
      role='navigation'
      className={cn(
        'relative h-full flex flex-col shrink-0 select-none border-e border-solid bg-gray-04 dark:bg-gray-80 border-black/16 dark:border-white/16',
        widthBreakpoint === WidthBreakpoint.Narrow && 'flex-col items-center',
      )}
      style={{ width }}
    >
      <div
        data-tauri-drag-region
        className='pt-10 pb-1.5 select-none cursor-default'
      >
        <header className='flex px-6 items-center'>
          <Menu className='mr-6' size={20} />
          <h1
            data-tauri-drag-region
            aria-live='assertive'
            className='flex-1 m-0 leading-5 font-medium text-xl tracking-tight select-none'
          >
            Chats
          </h1>
          <p className='flex items-center space-x-4'>
            <SquarePen size={20} strokeWidth={1.5} />
            <QRCodeDialog url='https://192.168.8.248:53317' />
          </p>
        </header>
      </div>

      <div>{children}</div>

      <div
        className={cn(
          'absolute w-2 top-0 bottom-0 start-full cursor-col-resize touch-none bg-transparent focus:outline-none',
          dragState === DragState.DRAGGING && 'bg-black/12 dark:bg-white/12',
        )}
        role='separator'
        aria-orientation='vertical'
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={preferredLeftPaneWidth}
        aria-valuenow={MAX_WIDTH}
        {...moveProps}
      ></div>
    </aside>
  );
}
