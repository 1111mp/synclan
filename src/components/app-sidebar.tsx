import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

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
} from '@/components/ui';
import { useConversationList, useIMStore } from '@/stores';

// This is sample data.
const data = {
  devices: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
};

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const navigate = useNavigate();
  const conversations = useConversationList();
  const setActiveConversation = useIMStore((s) => s.setActiveConversation);

  const onSelectDevice = (id: string) => {
    if (params?.id === id) return;

    setActiveConversation(id);
    void navigate(`/devices/${id}`);
  };

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader data-tauri-drag-region className='pt-7'>
        <DeviceSwitcher devices={data.devices} />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <NavDevices
          activeDeviceId={params.id}
          conversations={conversations}
          onSelectDevice={onSelectDevice}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
