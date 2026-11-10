import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  Ellipsis,
  Laptop,
  Monitor,
  Network,
  Smartphone,
  TrashIcon,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useConfirm } from '@/components';
import { PageHeader } from '@/components/page-header';
import { SettingsSection } from '@/components/settings-section';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  Spinner,
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
      return <Smartphone className='size-4 shrink-0' aria-hidden='true' />;
    case 'Windows':
    case 'macOS':
    case 'Linux':
      return <Laptop className='size-4 shrink-0' aria-hidden='true' />;
    default:
      return <Monitor className='size-4 shrink-0' aria-hidden='true' />;
  }
}

function ManagePage() {
  const current = useDeviceStore((s) => s.current);
  const confirm = useConfirm();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const {
    data: devices = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(current?.id),
  });

  const copyDeviceId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success(t('manage.idCopied'));
    } catch {
      toast.error(t('manage.copyFailed'));
    }
  };

  const handleRemoveDevice = async (device: IDevice) => {
    if (removingId) return;
    setRemovingId(device.id);
    try {
      const ok = await confirm({
        icon: <TrashIcon />,
        title: t('manage.removeTitle', { name: device.name }),
        description: t('manage.removeDescription'),
        confirmText: t('manage.remove'),
        actionVariant: 'destructive',
      });
      if (!ok) return;
      await removeDevice(device.id);
      toast.success(t('manage.removed'));
      await queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch {
      toast.error(t('manage.removeFailed'));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className='bg-background h-full min-h-0 w-full overflow-y-auto'>
      <PageHeader title={t('manage.title')} />
      <div className='@container mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10'>
        <div className='mb-10 flex items-start gap-4'>
          <span className='bg-muted border-border/60 flex size-11 shrink-0 items-center justify-center rounded-2xl border'>
            <Network className='size-5' aria-hidden='true' />
          </span>
          <div className='flex min-w-0 flex-col gap-1.5'>
            <p className='text-xl font-semibold tracking-tight'>
              {t('manage.heading')}
            </p>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              {t('manage.description')}
            </p>
          </div>
        </div>
        <div className='flex flex-col gap-8'>
          {current && (
            <SettingsSection
              title={t('manage.thisDevice')}
              description={t('manage.currentHostInfo')}
              icon={Monitor}
            >
              <div className='flex items-start gap-4 p-5'>
                <Avatar className='size-14 shrink-0 overflow-hidden'>
                  <AvatarImage
                    alt={current.name}
                    src={resolveResourceUrl(current.avatar)}
                  />
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
                <div className='flex min-w-0 flex-1 flex-col gap-2'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h2 className='min-w-0 text-base font-medium break-words'>
                      {current.name}
                    </h2>
                    <Badge variant='secondary'>
                      {t(`manage.roles.${current.role}`)}
                    </Badge>
                  </div>
                  <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                    <PlatformIcon platform={current.platform} />
                    <span className='break-words'>
                      {current.platform ?? '—'}
                      {current.browser && ` · ${current.browser}`}
                    </span>
                  </div>
                  <button
                    type='button'
                    aria-label={t('manage.copyDeviceId')}
                    title={current.id}
                    onClick={() => copyDeviceId(current.id)}
                    className='text-muted-foreground hover:text-foreground focus-visible:ring-ring flex max-w-full items-center gap-2 self-start rounded-md text-xs outline-none focus-visible:ring-2'
                  >
                    <span className='truncate font-mono'>ID: {current.id}</span>
                    <Copy className='size-3 shrink-0' aria-hidden='true' />
                  </button>
                </div>
              </div>
            </SettingsSection>
          )}
          <div className='border-border/50 border-t pt-8'>
            <SettingsSection
              title={t('manage.discoveredDevices')}
              description={t('manage.knownDevicesInfo')}
              icon={Network}
            >
              {isPending ? (
                <div
                  role='status'
                  className='text-muted-foreground flex min-h-40 items-center justify-center gap-2 text-sm'
                >
                  <Spinner />
                  {t('manage.loading')}
                </div>
              ) : isError ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant='icon'>
                      <Network />
                    </EmptyMedia>
                    <EmptyTitle>{t('manage.loadFailed')}</EmptyTitle>
                  </EmptyHeader>
                  <Button variant='outline' onClick={() => void refetch()}>
                    {t('manage.retry')}
                  </Button>
                </Empty>
              ) : devices.length === 0 ? (
                <Empty className='py-10'>
                  <EmptyHeader>
                    <EmptyMedia variant='icon'>
                      <Network />
                    </EmptyMedia>
                    <EmptyTitle>{t('manage.noDevicesFound')}</EmptyTitle>
                    <EmptyDescription>
                      {t('manage.emptyDescription')}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className='divide-border/60 divide-y'>
                  {devices.map((device) => (
                    <li key={device.id} className='@container/device p-5'>
                      <div className='flex items-start gap-3'>
                        <Avatar className='size-10 shrink-0 overflow-hidden'>
                          <AvatarImage
                            src={resolveResourceUrl(device.avatar)}
                            alt={device.name}
                          />
                          <AvatarFallback>
                            <User />
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <h3 className='min-w-0 text-sm font-medium break-words'>
                              {device.name}
                            </h3>
                            <Badge variant='secondary'>
                              {t(`manage.roles.${device.role}`)}
                            </Badge>
                          </div>
                          <p
                            title={device.id}
                            className='text-muted-foreground truncate font-mono text-xs'
                          >
                            {device.id}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              aria-label={t('manage.deviceActions', {
                                name: device.name,
                              })}
                              disabled={removingId !== null}
                            >
                              {removingId === device.id ? (
                                <Spinner />
                              ) : (
                                <Ellipsis />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align='end'
                            className='w-48 max-w-(--radix-dropdown-menu-content-available-width) whitespace-nowrap'
                          >
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                onSelect={() => void copyDeviceId(device.id)}
                              >
                                <Copy />
                                {t('manage.copyDeviceId')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant='destructive'
                                onSelect={() => void handleRemoveDevice(device)}
                              >
                                <TrashIcon />
                                {t('manage.remove')}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <dl className='text-muted-foreground mt-4 grid gap-3 text-xs @min-[28rem]/device:grid-cols-2'>
                        <div className='flex min-w-0 flex-col gap-1'>
                          <dt>
                            {t('manage.platform')} / {t('manage.browser')}
                          </dt>
                          <dd className='text-foreground flex items-center gap-2'>
                            <PlatformIcon platform={device.platform} />
                            <span className='break-words'>
                              {device.platform ?? '—'}
                              {device.browser && ` · ${device.browser}`}
                            </span>
                          </dd>
                        </div>
                        <div className='flex min-w-0 flex-col gap-1'>
                          <dt>{t('manage.updated')}</dt>
                          <dd className='text-foreground'>
                            <time
                              dateTime={new Date(
                                device.updatedAt,
                              ).toISOString()}
                            >
                              {new Date(device.updatedAt).toLocaleString(
                                i18n.language,
                                { dateStyle: 'medium', timeStyle: 'short' },
                              )}
                            </time>
                          </dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </SettingsSection>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ManagePage as Component, loader };
