'use client';

import {
  AudioWaveform,
  ChevronsUpDown,
  GalleryVerticalEnd,
  Plus,
  QrCode,
} from 'lucide-react';
import { useRef } from 'react';
import { useNavigate } from 'react-router';

import { QRCodeDialog, type QRCodeDialogRef } from '@/components/qrcode-dialog';
import {
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

import { useDeviceDiscover } from './device-discover';

function DeviceSwitcher() {
  const navigate = useNavigate();
  const { isMobile, toggleSidebar } = useSidebar();
  const { openDiscover } = useDeviceDiscover();

  const qrCodeRef = useRef<QRCodeDialogRef>(null);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:ml-2'
              >
                <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <GalleryVerticalEnd className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>Synclan</span>
                </div>
                <ChevronsUpDown className='ml-auto' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              align='start'
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className='text-muted-foreground text-xs'>
                Devices
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
                Welcome
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
                Quick Access
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
                  Devices Discover
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
