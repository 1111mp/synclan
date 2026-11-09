import type { ReactNode } from 'react';

function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header
      data-tauri-drag-region={OS_PLATFORM !== 'win32' ? '' : undefined}
      className='bg-background/95 sticky top-0 z-20 flex h-14 shrink-0 items-center px-6 backdrop-blur-sm select-none'
    >
      {/* Tauri checks the hit target, so decorative content must hit the header. */}
      <div className='pointer-events-none mx-auto flex w-full max-w-4xl items-center justify-between gap-4 pl-8'>
        <h1 className='text-sm font-medium'>{title}</h1>
        {description && (
          <span className='text-muted-foreground hidden text-xs sm:block'>
            {description}
          </span>
        )}
        {actions && <div className='pointer-events-auto'>{actions}</div>}
      </div>
    </header>
  );
}

export { PageHeader };
