import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ellipsis,
  Laptop,
  Monitor,
  Smartphone,
  TrashIcon,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useConfirm } from '@/components';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { resolveResourceUrl } from '@/lib/utils';
import { getDevices, removeDevice } from '@/services/cmd';
import { useDeviceStore } from '@/stores';

function loader() {}

function PlatformIcon({ platform }: { platform?: string }) {
  switch (platform) {
    case 'Android':
    case 'iOS':
    case 'iPadOS':
      return <Smartphone className='text-muted-foreground size-4' />;

    case 'Windows':
    case 'macOS':
    case 'Linux':
      return <Laptop className='text-muted-foreground size-4' />;

    default:
      return <Monitor className='text-muted-foreground size-4' />;
  }
}

function ManagePage() {
  const current = useDeviceStore((s) => s.current);
  const confirm = useConfirm();

  const { t } = useTranslation();

  const queryClient = useQueryClient();

  const { data: devices = [], isPending } = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(current?.id),
  });

  const handleRemoveDevice = async (device: IDevice) => {
    const ok = await confirm({
      icon: <TrashIcon />,
      title: `Remove "${device.name}"?`,
      description: 'Are you sure you want to remove this device?',
      confirmText: 'Delete',
      actionVariant: 'destructive',
    });

    if (!ok) return;

    try {
      await removeDevice(device.id);

      toast.success('Device removed');

      await queryClient.invalidateQueries({
        queryKey: ['devices'],
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove device');
    }
  };

  return (
    <div className='h-dvh w-full overflow-y-auto'>
      <header
        data-tauri-drag-region={OS_PLATFORM !== 'win32'}
        className='bg-background/80 sticky top-0 z-20 h-14 w-full shrink-0 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
      />
      <div className='mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-6'>
        {current && (
          <Card>
            <CardHeader>
              <CardTitle>{t('manage.thisDevice')}</CardTitle>
              <CardDescription>{t('manage.currentHostInfo')}</CardDescription>
            </CardHeader>

            <CardContent className='flex items-center gap-4'>
              <Avatar className='size-16'>
                <AvatarImage
                  alt={current?.name}
                  className='rounded-full'
                  src={resolveResourceUrl(current?.avatar)}
                />
                <AvatarFallback className='rounded-full'>
                  <User />
                </AvatarFallback>
              </Avatar>

              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <span className='text-lg font-medium'>{current.name}</span>

                  <Badge>{current.role}</Badge>
                </div>

                <div className='text-muted-foreground text-sm'>
                  ID: {current.id}
                </div>

                {/*{current.fingerprintId && (
                  <div className='text-muted-foreground text-sm'>
                    Fingerprint: {current.fingerprintId}
                  </div>
                )}*/}

                <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <PlatformIcon platform={current.platform} />
                  {current.platform ?? '-'}
                  {current.browser && ` · ${current.browser}`}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('manage.discoveredDevices')}</CardTitle>
            <CardDescription>{t('manage.knownDevicesInfo')}</CardDescription>
          </CardHeader>

          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('manage.device')}</TableHead>
                  <TableHead>{t('manage.role')}</TableHead>
                  <TableHead>{t('manage.platform')}</TableHead>
                  <TableHead>{t('manage.browser')}</TableHead>
                  <TableHead>{t('manage.updated')}</TableHead>
                  <TableHead className='bg-card sticky right-0 z-10 w-12' />
                </TableRow>
              </TableHeader>

              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={6} className='h-32 text-center'>
                      {t('manage.loading')}
                    </TableCell>
                  </TableRow>
                ) : devices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-muted-foreground h-32 text-center'
                    >
                      {t('manage.noDevicesFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <Avatar>
                            <AvatarImage src={device.avatar} />
                            <AvatarFallback>
                              <User />
                            </AvatarFallback>
                          </Avatar>

                          <div className='space-y-0.5'>
                            <div className='font-medium'>{device.name}</div>

                            <div className='text-muted-foreground text-xs'>
                              {device.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant='secondary'>{device.role}</Badge>
                      </TableCell>

                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <PlatformIcon platform={device.platform} />
                          {device.platform ?? '-'}
                        </div>
                      </TableCell>

                      <TableCell>{device.browser ?? '-'}</TableCell>

                      <TableCell>
                        {new Date(device.updatedAt).toLocaleString()}
                      </TableCell>

                      <TableCell className='bg-card sticky right-0'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'>
                              <Ellipsis className='size-4' />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    device.id,
                                  );
                                  toast.success('Device ID copied');
                                } catch {
                                  toast.error('Failed to copy Device ID');
                                }
                              }}
                            >
                              {t('manage.copyDeviceId')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant='destructive'
                              onClick={() => handleRemoveDevice(device)}
                            >
                              {t('manage.remove')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { ManagePage as Component, loader };
