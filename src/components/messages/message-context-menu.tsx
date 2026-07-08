import {
  autoPlacement,
  autoUpdate,
  flip,
  FloatingPortal,
  hide,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStyles,
} from '@floating-ui/react';
import { useImperativeHandle, useState, type Ref } from 'react';

import { cn } from '@/lib/utils';

type MessageContextMenuInfo = {
  x: number;
  y: number;
};

type MessageContextMenuRef = {
  open: (info: MessageContextMenuInfo) => void;
  hide: () => void;
};

type Props = {
  ref?: Ref<MessageContextMenuRef>;
};

function MessageContextMenu({ ref }: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const { context, refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [autoPlacement(), flip(), hide()],
    whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(context, {
    ancestorScroll: true,
    escapeKey: true,
    referencePress: true,
  });
  const { getFloatingProps } = useInteractions([dismiss]);
  const { isMounted, styles } = useTransitionStyles(context, {
    initial: {
      opacity: 0,
      transform: 'scale(0.95)',
    },
    open: {
      opacity: 1,
      transform: 'scale(1)',
    },
    close: {
      opacity: 0,
      transform: 'scale(0.95)',
    },
    common: ({ side }) => ({
      transformOrigin: {
        top: 'bottom center',
        bottom: 'top center',
        left: 'center right',
        right: 'center left',
      }[side],
    }),
  });

  useImperativeHandle(ref, () => ({
    open: onOpenHandler,
    hide: onHideHandler,
  }));

  const onOpenHandler = ({ x, y }: MessageContextMenuInfo) => {
    setIsOpen(true);
    refs.setPositionReference({
      getBoundingClientRect() {
        return {
          width: 0,
          height: 0,
          x: x,
          y: y,
          top: y,
          left: x,
          right: x,
          bottom: y,
        };
      },
    });
    setIsOpen(true);
  };

  const onHideHandler = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <FloatingPortal>
      {isMounted && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
        >
          <div
            className={cn(
              'z-50 max-h-(--radix-context-menu-content-available-height) min-w-36 overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10',
            )}
            style={styles}
          >
            <ContextMenuItem>Back</ContextMenuItem>
            <ContextMenuItem>Forward</ContextMenuItem>
          </div>
        </div>
      )}
    </FloatingPortal>
  );
}

function ContextMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
  inset?: boolean;
  variant?: 'default' | 'destructive';
}) {
  return (
    <div
      data-slot='context-menu-item'
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/context-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none hover:bg-accent data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus:*:[svg]:text-accent-foreground data-[variant=destructive]:*:[svg]:text-destructive",
        className,
      )}
      {...props}
    />
  );
}

export {
  MessageContextMenu,
  type MessageContextMenuInfo,
  type Props as MessageContextMenuProps,
  type MessageContextMenuRef,
};
