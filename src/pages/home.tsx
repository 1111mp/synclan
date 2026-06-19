import { Fragment } from 'react';
import { Outlet, useMatches, type Params, type UIMatch } from 'react-router';

import { AppSidebar } from '@/components';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui';

type BreadcrumbMatch = Omit<UIMatch, 'handle'> & {
  handle: {
    breadcrumb?:
      | string
      | ((data: any, params: Params<string>) => React.ReactNode);
  };
};

function HomePage() {
  const matches = useMatches() as BreadcrumbMatch[];
  const validMatches = matches.filter(
    (match) => match.handle && match.handle.breadcrumb,
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header
          data-tauri-drag-region
          className='region-drag flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
        >
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='region-no-drag -ml-1' />
            {validMatches.length > 0 ? (
              <>
                <Separator
                  orientation='vertical'
                  className='mr-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center'
                />
                <Breadcrumb>
                  <BreadcrumbList>
                    {validMatches.map((match, index) => {
                      const { breadcrumb } = match.handle,
                        isLast = index === validMatches.length - 1;

                      const label =
                        typeof breadcrumb === 'function'
                          ? breadcrumb(match.loaderData, match.params)
                          : breadcrumb;

                      return (
                        <Fragment key={match.pathname}>
                          <BreadcrumbItem className='hidden md:block'>
                            {isLast ? (
                              <BreadcrumbPage className='region-no-drag'>
                                {label}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink className='region-no-drag'>
                                {label}
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                          {!isLast && <BreadcrumbSeparator />}
                        </Fragment>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              </>
            ) : null}
          </div>
        </header>
        <div className='flex flex-1 flex-col'>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default HomePage;
