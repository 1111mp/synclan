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
  sidebarDetailsClassName,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui';
import { useFormatMessageTime } from '@/hooks';
import { cn, resolveResourceUrl } from '@/lib/utils';
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
  const formatMessageTime = useFormatMessageTime();

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
    <SidebarGroup className='px-3 pt-0 transition-[padding] duration-(--sidebar-motion-duration) ease-(--sidebar-motion-ease) group-data-[collapsible=icon]:px-2 motion-reduce:transition-none'>
      <SidebarGroupLabel>Devices</SidebarGroupLabel>
      <SidebarMenu>
        {conversations.map((conv) => {
          const name = conv?.device?.name ?? t('welcome.unknownDevice'),
            unread = conv?.unreadCount ?? 0;
          const label =
            unread > 0
              ? t('navDevices.deviceUnread', { name, count: unread })
              : name;

          return (
            <SidebarMenuItem key={conv.id}>
              <SidebarMenuButton
                asChild
                className='data-[active=true]:bg-sidebar-accent/80 rounded-xl transition-[background-color,box-shadow] duration-150 data-[active=true]:shadow-xs motion-reduce:transition-none'
                size='xl'
                aria-label={label}
                isActive={activeDeviceId === conv.id}
                tooltip={label}
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
                <Item asChild>
                  <button type='button'>
                    <ItemMedia className='relative translate-y-0! self-center!'>
                      <Avatar size='lg'>
                        <AvatarImage
                          src={resolveResourceUrl(conv?.device?.avatar)}
                          className='rounded-full'
                        />
                        <AvatarFallback>
                          <User />
                        </AvatarFallback>
                      </Avatar>
                      {unread > 0 && (
                        <span
                          data-slot='sidebar-avatar-unread'
                          aria-hidden='true'
                          className='bg-primary text-primary-foreground ring-sidebar pointer-events-none absolute -top-0.5 -right-0.5 hidden h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold tabular-nums ring-2 group-data-[collapsible=icon]:flex'
                        >
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </ItemMedia>
                    <ItemContent
                      className={cn(
                        sidebarDetailsClassName,
                        'w-[calc(var(--sidebar-width)-7.625rem)] flex-none gap-1',
                      )}
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <ItemTitle className='line-clamp-1 break-all'>
                          {name}
                        </ItemTitle>

                        <span className='text-muted-foreground shrink-0 text-xs'>
                          {formatMessageTime(conv?.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <div className='flex min-w-0 items-center justify-between gap-2'>
                        <ItemDescription className='line-clamp-1 min-w-0 flex-1 break-all'>
                          {conv?.lastMessage?.plainContent}
                        </ItemDescription>
                        {unread > 0 && (
                          <SidebarMenuBadge
                            aria-hidden='true'
                            className='bg-primary text-primary-foreground static h-4 min-w-4 shrink-0 rounded-full px-1.5 text-[10px] leading-none font-semibold'
                          >
                            {unread > 99 ? '99+' : unread}
                          </SidebarMenuBadge>
                        )}
                      </div>
                    </ItemContent>
                  </button>
                </Item>
              </SidebarMenuButton>
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
