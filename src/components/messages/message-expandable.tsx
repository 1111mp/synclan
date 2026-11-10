import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  type PropsWithChildren,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExpandableProps extends PropsWithChildren {
  maxHeight?: number;
  className?: string;
}

function MessageExpandable({
  children,
  maxHeight = 520,
  className,
}: ExpandableProps) {
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [hasCode, setHasCode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const { t } = useTranslation();

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // Images and highlighted code can finish laying out after the first paint.
    const measure = () => {
      setOverflow(el.scrollHeight > maxHeight);
      setHasCode(!!el.querySelector('code'));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxHeight]);

  return (
    <div
      ref={containerRef}
      className={cn('group/expandable relative min-w-0', className)}
    >
      <div
        id={id}
        style={!expanded ? { maxHeight, overflow: 'hidden' } : undefined}
      >
        <div ref={contentRef}>{children}</div>
      </div>
      {overflow && hasCode && !expanded && (
        <div
          aria-hidden
          className='from-background via-background/60 group-data-[variant=muted]/bubble:from-muted group-data-[variant=muted]/bubble:via-muted/60 pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t to-transparent'
        />
      )}
      {overflow && (
        <div
          className={cn(
            hasCode
              ? 'absolute inset-x-0 bottom-3 flex justify-center'
              : 'mt-2 flex justify-start border-t border-current/10 pt-2',
            hasCode &&
              expanded &&
              'opacity-0 transition-opacity duration-200 group-hover/expandable:opacity-100 group-focus-within/expandable:opacity-100 [@media(hover:none)]:opacity-100',
          )}
        >
          <Button
            size='sm'
            variant='secondary'
            className={cn(hasCode && 'rounded-full shadow-md')}
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => {
              setExpanded(!expanded);
              if (hasCode && expanded) {
                requestAnimationFrame(() =>
                  containerRef.current?.scrollIntoView({ block: 'nearest' }),
                );
              }
            }}
          >
            {expanded ? (
              <ChevronUp data-icon='inline-start' />
            ) : (
              <ChevronDown data-icon='inline-start' />
            )}
            {t(expanded ? 'message.collapse' : 'message.expand')}
          </Button>
        </div>
      )}
    </div>
  );
}
export { MessageExpandable };
