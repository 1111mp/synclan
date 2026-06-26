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
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui';

export function NavDevices({
  activeDeviceId,
  conversations = [],
  onSelectDevice,
}: {
  activeDeviceId?: string;
  conversations?: IConversations[];
  onSelectDevice?: (id: string) => void;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Devices</SidebarGroupLabel>
      <SidebarMenu>
        {conversations.map((conv) => {
          const name = conv?.device?.name ?? '未知设备',
            unread = conv?.unreadCount ?? 0;

          return (
            <SidebarMenuItem key={conv.id}>
              <SidebarMenuButton
                asChild
                size='xl'
                isActive={activeDeviceId === conv.id}
                tooltip={name}
                onClick={() => {
                  onSelectDevice?.(conv.id);
                }}
              >
                <Item>
                  <ItemMedia>
                    <Avatar size='lg'>
                      <AvatarImage
                        src={conv?.device?.avatar}
                        className='rounded-full'
                      />
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent className='gap-1'>
                    <ItemTitle className='line-clamp-1 break-all'>
                      {name}
                    </ItemTitle>
                    <ItemDescription className='line-clamp-1 break-all'>
                      This is a message from device 1
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </SidebarMenuButton>
              {unread > 0 && (
                <SidebarMenuAction>
                  <SidebarMenuBadge>
                    {unread > 99 ? '99+' : unread}
                  </SidebarMenuBadge>
                </SidebarMenuAction>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
