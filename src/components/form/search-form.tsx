import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Label,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
  useSidebar,
} from '@/components/ui';
import { cn } from '@/lib/utils';

export function SearchForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const { isMobile, state } = useSidebar();
  const collapsed = !isMobile && state === 'collapsed';

  const { t } = useTranslation();

  // Keep search mounted so its space can collapse without a layout jump.
  return (
    <form
      {...props}
      className={cn(
        'mb-0 grid grid-rows-[1fr] opacity-100 [transition:grid-template-rows_var(--sidebar-motion-duration)_var(--sidebar-motion-ease),margin-bottom_var(--sidebar-motion-duration)_var(--sidebar-motion-ease),opacity_160ms_ease_80ms] data-[collapsed=true]:-mb-3 data-[collapsed=true]:grid-rows-[0fr] data-[collapsed=true]:opacity-0 data-[collapsed=true]:[transition:grid-template-rows_var(--sidebar-motion-duration)_var(--sidebar-motion-ease),margin-bottom_var(--sidebar-motion-duration)_var(--sidebar-motion-ease),opacity_90ms_ease] [&[hidden]]:hidden motion-reduce:transition-none!',
        className,
      )}
      hidden={isMobile}
      data-collapsed={collapsed}
      inert={collapsed}
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit?.(e);
      }}
    >
      <div className='min-h-0 overflow-hidden'>
        <SidebarGroup className='w-[calc(var(--sidebar-width)-2.5rem)] p-0'>
          <SidebarGroupContent className='relative'>
            <Label htmlFor='search' className='sr-only'>
              {t('search.search')}
            </Label>
            {/* An inset focus ring stays rounded inside the collapse clipping container. */}
            <SidebarInput
              id='search'
              placeholder={t('search.searchDevices')}
              className='focus-visible:border-foreground/35 focus-visible:ring-foreground/10 pl-8 focus-visible:ring-2 focus-visible:ring-inset'
            />
            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 select-none' />
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    </form>
  );
}
