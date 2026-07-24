'use client';

import { ChevronsUpDown, Laptop, Settings, User, UserPen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui';
import { isWeb } from '@/lib/constant';
import { resolveResourceUrl } from '@/lib/utils';

export function NavUser({ current }: { current?: IDevice | null }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isMobile, toggleSidebar } = useSidebar();

  const { t } = useTranslation();

  const handleNavigate = (path: string) => {
    if (pathname !== path) {
      void navigate(path);
    }

    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:ml-2 group-data-[collapsible=icon]:p-0!'
            >
              <Avatar className='size-8'>
                <AvatarImage
                  src={resolveResourceUrl(current?.avatar)}
                  alt={current?.name}
                  className='rounded-full'
                />
                <AvatarFallback className='rounded-full'>
                  <User />
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>{current?.name}</span>
                {/*<span className='truncate text-xs'>{current?.id}</span>*/}
              </div>
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='size-8'>
                  <AvatarImage
                    className='rounded-full'
                    src={resolveResourceUrl(current?.avatar)}
                    alt={current?.name}
                  />
                  <AvatarFallback className='rounded-full'>
                    <User />
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{current?.name}</span>
                  {/*<span className='truncate text-xs'>{current?.id}</span>*/}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => handleNavigate('/profile')}>
                <UserPen />
                {t('navUser.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate('/settings')}>
                <Settings />
                {t('navUser.settings')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {!isWeb && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigate('/manager')}>
                  <Laptop />
                  {t('navUser.manageDevices')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
