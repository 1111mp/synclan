'use client';

import { check } from '@tauri-apps/plugin-updater';
import { AudioWaveform, ChevronsUpDown, Plus, QrCode } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import SynclanLogo from '@/assets/synclan.svg';
import { useDeviceDiscover } from '@/components/device-discover';
import { QRCodeDialog, type QRCodeDialogRef } from '@/components/qrcode-dialog';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
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
import { cn } from '@/lib/utils';
import { useSynclanStore, useUpdaterStore } from '@/stores';

function DeviceSwitcher() {
  const qrCodeRef = useRef<QRCodeDialogRef>(null);

  const navigate = useNavigate();
  const { open, isMobile, toggleSidebar } = useSidebar();
  const { openDiscover } = useDeviceDiscover();
  const config = useSynclanStore((s) => s.config);
  const update = useUpdaterStore((s) => s.update);

  const { t } = useTranslation();

  useEffect(() => {
    if (isWeb || !config?.auto_check_update) return;

    void check().then((update) => {
      if (update !== null) {
        useUpdaterStore.getState().setUpdate(update);
      }
    });
  }, [config?.auto_check_update]);

  const hasUpdate = update !== null;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem className='relative'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:ml-2'
              >
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg'>
                  {/*<GalleryVerticalEnd className='size-4' />*/}
                  <img src={SynclanLogo} className='size-8' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>Synclan</span>
                </div>
                <ChevronsUpDown className='ml-auto' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            {!isWeb && hasUpdate && (
              <Button
                variant='ghost'
                className={cn(
                  'absolute top-1 right-8 p-0 h-fit',
                  !open && !isMobile && '-top-2.5 -right-1',
                )}
                onClick={(evt) => {
                  evt.stopPropagation();
                  evt.preventDefault();

                  useUpdaterStore.getState().setOpen(true);
                }}
              >
                <Badge
                  variant='destructive'
                  className={'h-5 cursor-default px-1 text-[10px]'}
                >
                  NEW
                </Badge>
              </Button>
            )}
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              align='start'
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className='text-muted-foreground text-xs'>
                {t('deviceSwitcher.devices')}
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  void navigate('/welcome');
                  if (isMobile) {
                    toggleSidebar();
                  }
                }}
                className='gap-2 p-2'
              >
                <div className='flex size-6 items-center justify-center rounded-md border'>
                  <AudioWaveform className='size-3.5 shrink-0' />
                </div>
                {t('deviceSwitcher.welcome')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className='gap-2 p-2'
                onClick={() => {
                  qrCodeRef.current?.open();
                }}
              >
                <div className='flex size-6 items-center justify-center rounded-md border bg-transparent'>
                  <QrCode className='size-3.5 shrink-0' />
                </div>
                {t('deviceSwitcher.quickAccess')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='gap-2 p-2'
                onClick={() => {
                  openDiscover();
                }}
              >
                <div className='flex size-6 items-center justify-center rounded-md border bg-transparent'>
                  <Plus className='size-4' />
                </div>
                <div className='text-muted-foreground font-medium'>
                  {t('deviceSwitcher.devicesDiscover')}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <QRCodeDialog ref={qrCodeRef} />
    </>
  );
}

export { DeviceSwitcher };
