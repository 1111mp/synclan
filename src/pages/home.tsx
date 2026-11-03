import { check } from '@tauri-apps/plugin-updater';
import { useEffect } from 'react';
import { Outlet } from 'react-router';

import {
  AppSidebar,
  DeviceDiscoverProvider,
  ImagePreviewProvider,
} from '@/components';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  Toaster,
} from '@/components/ui';
import { isWeb } from '@/lib/constant';
import { useSynclanStore, useUpdaterStore } from '@/stores';

function HomePage() {
  const config = useSynclanStore((s) => s.config);

  useEffect(() => {
    if (isWeb || !config?.auto_check_update) return;

    void check().then((update) => {
      if (update !== null) {
        useUpdaterStore.getState().setUpdate(update);
      }
    });
  }, [config?.auto_check_update]);

  return (
    <ImagePreviewProvider>
      <DeviceDiscoverProvider>
        <SidebarProvider className='bg-background via-background to-muted h-dvh min-h-0 overflow-hidden bg-linear-to-br from-(--workspace-tint) [--workspace-tint:oklch(from_var(--background)_l_0.025_290)]'>
          <AppSidebar />
          {/* Keep page scrollers inside the floating panel's desktop gutters. */}
          <SidebarInset className='bg-card min-w-0 md:my-2 md:mr-2 md:overflow-hidden md:rounded-xl md:shadow-[0_2px_16px_-8px_rgb(0_0_0/0.12)]'>
            <div className='relative flex h-dvh min-h-0 flex-1 flex-col [view-transition-name:page-content] md:h-[calc(100dvh-1rem)]'>
              <SidebarTrigger className='region-no-drag absolute top-3.5 left-1 z-50' />
              <Outlet />
              <Toaster position='top-center' richColors={true} />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </DeviceDiscoverProvider>
    </ImagePreviewProvider>
  );
}

export default HomePage;
