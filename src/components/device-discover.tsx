import { useQuery } from '@tanstack/react-query';
import { ChevronRightIcon, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Skeleton,
} from '@/components/ui';
import { devicesDiscover } from '@/services/cmd';
import { useIMStore } from '@/stores';

export function DeviceDiscover({ excludeIds = [] }: { excludeIds?: string[] }) {
  const [open, setOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  const addConversations = useIMStore((s) => s.addConversations);
  const setActiveConversation = useIMStore((s) => s.setActiveConversation);

  const { data: devices = [] } = useQuery({
    queryKey: ['devices_discover', excludeIds],
    queryFn: () => devicesDiscover(excludeIds),
    refetchInterval: 3000,
    enabled: open,
  });

  const hasDevices = devices?.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='w-full' size='xl'>
          Devices Discover
        </Button>
      </DialogTrigger>
      <DialogContent className='top-2/5 sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Devices Discover</DialogTitle>
          <DialogDescription>
            Please ensure that the desired target is also on the same Wi-Fi
            network.
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[60vh] overflow-y-auto sm:max-h-[70vh]'>
          {hasDevices ? (
            <ItemGroup className='gap-4'>
              {devices.map((device) => (
                <Item
                  key={device.id}
                  variant='outline'
                  role='listitem'
                  className='hover:bg-muted'
                  onClick={() => {
                    addConversations([device]);
                    setActiveConversation(device.id);

                    void navigate(`/devices/${device.id}`);
                  }}
                >
                  <ItemMedia>
                    <Avatar size='lg'>
                      <AvatarImage
                        src={device?.avatar}
                        className='rounded-full'
                      />
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent className='gap-1'>
                    <ItemTitle className='line-clamp-1 break-all'>
                      {device?.name}
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRightIcon className='size-4' />
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          ) : (
            <Item>
              <ItemMedia>
                <Skeleton className='size-10 rounded-full' />
              </ItemMedia>
              <ItemContent>
                <Skeleton className='h-4 w-62.5' />
                <Skeleton className='h-4 w-50' />
              </ItemContent>
            </Item>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
