import { useQuery } from '@tanstack/react-query';
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
import { getDevices } from '@/services/cmd';
import { useDeviceStore } from '@/stores';

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: 'https://ui.shadcn.com/avatars/shadcn.jpg',
  },
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
  let params = useParams();
  const navigate = useNavigate();
  const current = useDeviceStore((s) => s.current);

  const { data: devices = [] } = useQuery({
    queryKey: ['devices', current?.id],
    queryFn: () => getDevices(current?.id),
    enabled: !!current?.id,
  });

  const onSelectDevice = (id: string) => {
    if (params?.id === id) return;
    void navigate(`/devices/${id}`);
  };

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader data-tauri-drag-region className='pt-7'>
        <DeviceSwitcher devices={data.devices} />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <NavDevices devices={devices} onSelectDevice={onSelectDevice} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
