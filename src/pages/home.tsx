import { AppSidebar } from '@/components';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui';

function HomePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='relative'>
          <div className='absolute top-6 peer-data-[state=open]:top-2'>
            <SidebarTrigger />
          </div>
        </header>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default HomePage;
