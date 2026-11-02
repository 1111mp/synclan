import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { ConnectionStatus } from '@/components/connection-status';
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
  const [keyword, setKeyword] = useState<string>('');

  const params = useParams();
  const localtion = useLocation();
  const navigate = useNavigate();

  const current = useDeviceStore((s) => s.current);
  const conversations = useConversationList();
  const setActiveConversation = useIMStore((s) => s.setActiveConversation);

  const { isMobile, toggleSidebar } = useSidebar();

  const filteredConversations = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) return conversations;

    return conversations.filter(
      (item) =>
        item.device?.name.toLowerCase().includes(q) ||
        item.lastMessage?.plainContent?.includes(q),
    );
  }, [conversations, keyword]);

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
        className={cn(
          'gap-3 px-3 pb-3 transition-[padding] duration-(--sidebar-motion-duration) ease-(--sidebar-motion-ease) motion-reduce:transition-none group-data-[collapsible=icon]:px-2',
          OS_PLATFORM !== 'win32' && !isWeb && 'pt-7',
        )}
      >
        <DeviceSwitcher />
        <ConnectionStatus />
        <SearchForm
          onChange={(e) => {
            console.log(e.target.value);
            setKeyword(e.target.value);
          }}
        />
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
          conversations={filteredConversations}
          onSelectDevice={onSelectDevice}
        />
      </SidebarContent>
      <SidebarFooter className='px-3 transition-[padding] duration-(--sidebar-motion-duration) ease-(--sidebar-motion-ease) group-data-[collapsible=icon]:px-2 motion-reduce:transition-none'>
        <NavUser current={current} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
