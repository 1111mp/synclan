import { useLocation, useNavigate, useParams } from 'react-router';

import { DeviceSwitcher } from '@/components/device-switcher';
import { SearchForm } from '@/components/form';
import { NavDevices } from '@/components/nav-devices';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui';
import { isWeb } from '@/lib/constant';
import { cn } from '@/lib/utils';
import { useConversationList, useDeviceStore, useIMStore } from '@/stores';

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const localtion = useLocation();
  const navigate = useNavigate();

  const current = useDeviceStore((s) => s.current);
  const conversations = useConversationList();
  const setActiveConversation = useIMStore((s) => s.setActiveConversation);

  const { isMobile, toggleSidebar } = useSidebar();

  const onSelectDevice = (id: string) => {
    if (params?.id === id) return;

    setActiveConversation(id);
    void navigate(`/devices/${id}`);

    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <Sidebar modal={false} collapsible='icon' variant='floating' {...props}>
      <SidebarHeader
        data-tauri-drag-region
        className={cn(OS_PLATFORM !== 'win32' && !isWeb && 'pt-7')}
      >
        <DeviceSwitcher />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent
        onClick={(evt) => {
          if (
            evt.target === evt.currentTarget &&
            localtion.pathname.includes('/devices')
          ) {
            void navigate('/welcome');

            if (isMobile) {
              toggleSidebar();
            }
          }
        }}
      >
        <NavDevices
          current={current}
          activeDeviceId={params.id}
          conversations={conversations}
          onSelectDevice={onSelectDevice}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser current={current} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
