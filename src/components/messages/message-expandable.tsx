import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  type CSSProperties,
  type PropsWithChildren,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ExpandableProps extends PropsWithChildren {
  /** 最大折叠高度(px) */
  maxHeight?: number;
  className?: string;
  /** 渐变层颜色，建议传 Bubble 的背景色 */
  overlayClassName?: string;
}

function MessageExpandable({
  children,
  maxHeight = 520,
  className,
  overlayClassName,
}: ExpandableProps) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [overflow, setOverflow] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const measuredRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (measuredRef.current) return;

    const el = contentRef.current;
    if (!el) return;

    measuredRef.current = true;
    setOverflow(el.scrollHeight > maxHeight);
  }, [children, maxHeight]);

  const handleCollapse = (expanded: boolean) => {
    setExpanded(expanded);

    containerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  };

  const containerStyle: CSSProperties =
    !expanded && overflow
      ? {
          maxHeight,
          overflow: 'hidden',
        }
      : {};

  return (
    <div ref={containerRef} className={cn('relative group', className)}>
      <div style={containerStyle}>
        <div ref={contentRef}>{children}</div>
      </div>

      {!expanded && overflow && (
        <>
          <div
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background via-background/60 to-transparent',
              overlayClassName,
            )}
          />

          <div className='absolute inset-x-0 bottom-3 flex justify-center'>
            <Button
              size='sm'
              variant='secondary'
              className='pointer-events-auto rounded-full shadow-md'
              onClick={() => handleCollapse(true)}
            >
              <ChevronDown className='mr-1 h-4 w-4' />
              展开
            </Button>
          </div>
        </>
      )}

      {expanded && overflow && (
        <div className='pointer-events-none absolute inset-x-0 bottom-2 flex justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
          <Button
            size='sm'
            variant='secondary'
            className='pointer-events-auto rounded-full shadow-md'
            onClick={() => handleCollapse(false)}
          >
            <ChevronUp className='mr-1 h-4 w-4' />
            收起
          </Button>
        </div>
      )}
    </div>
  );
}

export { MessageExpandable };
