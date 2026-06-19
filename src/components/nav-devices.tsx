import { User } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui';

export function NavDevices({
  devices = [],
  onSelectDevice,
}: {
  devices?: IDevice[];
  onSelectDevice?: (id: string) => void;
}) {
  console.log('devices', devices);
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Devices</SidebarGroupLabel>
      <SidebarMenu>
        {devices.map((device) => (
          <SidebarMenuItem key={device.id}>
            <SidebarMenuButton
              asChild
              size='xl'
              tooltip={device.name}
              onClick={() => {
                onSelectDevice?.(device.id);
              }}
            >
              <Item>
                <ItemMedia>
                  <Avatar size='lg'>
                    <AvatarImage src={device.avatar} className='rounded-full' />
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent className='gap-1'>
                  <ItemTitle className='line-clamp-1 break-all'>
                    {device.name}
                  </ItemTitle>
                  <ItemDescription className='line-clamp-1 break-all'>
                    This is a message from device 1
                  </ItemDescription>
                </ItemContent>
              </Item>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {/*<SidebarMenuItem>
          <SidebarMenuButton asChild size='xl' tooltip='device 1'>
            <Item>
              <ItemMedia>
                <Avatar size='lg'>
                  <AvatarImage
                    src='https://ui.shadcn.com/avatars/shadcn.jpg'
                    className='rounded-full'
                  />
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent className='gap-1'>
                <ItemTitle className='line-clamp-1 break-all'>
                  device 1
                </ItemTitle>
                <ItemDescription className='line-clamp-1 break-all'>
                  This is a message from device 1
                </ItemDescription>
              </ItemContent>
            </Item>
          </SidebarMenuButton>
        </SidebarMenuItem>*/}
      </SidebarMenu>
    </SidebarGroup>
  );
}
