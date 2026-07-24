import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Label,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
  useSidebar,
} from '@/components/ui';

export function SearchForm({ ...props }: React.ComponentProps<'form'>) {
  const { isMobile, state } = useSidebar();

  const { t } = useTranslation();

  return (
    <form
      {...props}
      hidden={state === 'collapsed' || isMobile}
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit?.(e);
      }}
    >
      <SidebarGroup className='py-0'>
        <SidebarGroupContent className='relative'>
          <Label htmlFor='search' className='sr-only'>
            {t('search.search')}
          </Label>
          <SidebarInput
            id='search'
            placeholder={t('search.searchDevices')}
            className='pl-8'
          />
          <Search className='pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none' />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}
