import { Outlet } from 'react-router';

import { AppSidebar } from '@/components';
import { SidebarInset, SidebarProvider } from '@/components/ui';

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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className='rerelative flex flex-1 flex-col [view-transition-name:page-content]'>
          {/*<SidebarTrigger className='region-no-drag absolute top-3.5 left-1 z-50 opacity-0 group-has-data-[collapsible=icon]/sidebar-wrapper:opacity-100' />*/}
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default HomePage;
