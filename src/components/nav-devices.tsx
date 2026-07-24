import { TrashIcon, User } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

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
  useSidebar,
} from '@/components/ui';
import { resolveResourceUrl } from '@/lib/utils';
import { deleteConversationMessages } from '@/services/cmd';
import { useIMStore } from '@/stores';

import { useConfirm } from './confirm-dialog';
import {
  FloatingContextMenu,
  FloatingContextMenuItem,
  type FloatingContextMenuRef,
} from './floating-context-menu';

type ContextMenuData = {
  id: string;
};

export function NavDevices({
  current,
  activeDeviceId,
  conversations = [],
  onSelectDevice,
}: {
  current?: IDevice | null;
  activeDeviceId?: string;
  conversations?: IConversations[];
  onSelectDevice?: (id: string) => void;
}) {
  const contextMenu = useRef<FloatingContextMenuRef<ContextMenuData>>(null);

  const navigate = useNavigate();
  const { isMobile, toggleSidebar } = useSidebar();
  const { t } = useTranslation();

  const deleteConversation = useIMStore((s) => s.deleteConversation);

  const confirm = useConfirm();

  const onDeleteDevice = async (id?: string) => {
    if (!current?.id || !id) return;

    deleteConversation(id);
    try {
      await deleteConversationMessages(current?.id, id);
    } catch {
      // TODO: 处理删除消息失败
    }

    if (id === activeDeviceId) {
      void navigate('/welcome');

      if (isMobile) {
        toggleSidebar();
      }
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Devices</SidebarGroupLabel>
      <SidebarMenu>
        {conversations.map((conv) => {
          const name = conv?.device?.name ?? t('welcome.unknownDevice'),
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
                onContextMenu={(evt) => {
                  evt.preventDefault();
                  evt.stopPropagation();

                  contextMenu.current?.open({
                    x: evt.clientX,
                    y: evt.clientY,
                    data: {
                      id: conv.id,
                    },
                  });
                }}
              >
                <Item>
                  <ItemMedia>
                    <Avatar size='lg'>
                      <AvatarImage
                        src={resolveResourceUrl(conv?.device?.avatar)}
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
                      {conv?.lastMessage?.plainContent}
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
      <FloatingContextMenu<ContextMenuData> ref={contextMenu}>
        {(data) => (
          <>
            <FloatingContextMenuItem
              variant='destructive'
              onClick={async (evt) => {
                evt.stopPropagation();

                contextMenu.current?.hide();

                const ok = await confirm({
                  icon: <TrashIcon />,
                  title: t('navDevices.deleteDevice'),
                  description: t('navDevices.deleteDescription'),
                  actionVariant: 'destructive',
                  confirmText: t('navDevices.delete'),
                });

                if (ok) {
                  await onDeleteDevice(data?.id);
                }
              }}
            >
              <TrashIcon />
              {t('navDevices.delete')}
            </FloatingContextMenuItem>
          </>
        )}
      </FloatingContextMenu>
    </SidebarGroup>
  );
}
