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
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className='relative flex flex-1 flex-col [view-transition-name:page-content]'>
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
