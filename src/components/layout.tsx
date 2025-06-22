import { NavSidebar } from './nav-side-bar';

function Layout() {
  return (
    <main className='w-full h-full flex overflow-hidden'>
      <NavSidebar>
        <div></div>
      </NavSidebar>
      <div className='flex-1'></div>
    </main>
  );
}

export { Layout };
