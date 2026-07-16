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

// type BreadcrumbMatch = Omit<UIMatch, 'handle'> & {
//   handle: {
//     breadcrumb?:
//       | string
//       | ((data: any, params: Params<string>) => React.ReactNode);
//   };
// };

function HomePage() {
  // const matches = useMatches() as BreadcrumbMatch[];
  // const validMatches = matches.filter(
  //   (match) => match.handle && match.handle.breadcrumb,
  // );

  return (
    <ImagePreviewProvider>
      <DeviceDiscoverProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className='relative flex flex-1 flex-col [view-transition-name:page-content]'>
              <SidebarTrigger className='region-no-drag absolute top-3.5 left-1 z-50' />
              <Outlet />
              <Toaster position='top-center' />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </DeviceDiscoverProvider>
    </ImagePreviewProvider>
  );
}

export default HomePage;
