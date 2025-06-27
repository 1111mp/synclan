import { Outlet } from 'react-router';
import { NavSidebar } from './nav-side-bar';

function Layout({ children }: { children?: React.ReactNode }) {
  return (
    <div className='w-full h-full flex overflow-hidden'>
      <NavSidebar>{children}</NavSidebar>
      <main className='flex-1'>
        <Outlet />
      </main>
    </div>
  );
}

export { Layout };
