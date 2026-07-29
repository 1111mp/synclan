import { FolderSearch, User } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Spinner,
} from '@/components/ui';
import { DEVICE_ID_STORAGE_KEY } from '@/lib/device';
import { resolveResourceUrl } from '@/lib/utils';
import { searchRestoreDevice } from '@/services/cmd';

function RestorePage() {
  const [keyword, setKeyword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [selectedId, setSelectedId] = useState<string>();

  const { t } = useTranslation();

  const handleSearch = async () => {
    const value = keyword.trim();
    if (!value) return;

    setLoading(true);

    try {
      const result = await searchRestoreDevice(value);

      setDevices(result);

      if (result.length === 1) {
        setSelectedId(result[0].id);
      } else {
        setSelectedId(undefined);
      }

      setSearched(true);
    } catch (error) {
      console.error('Failed to search restore device:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : t('restoreDevice.searchFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = () => {
    if (!selectedId) {
      return;
    }

    localStorage.setItem(DEVICE_ID_STORAGE_KEY, selectedId);

    window.location.href = '/';
  };

  return (
    <div className='h-dvh w-full overflow-y-auto'>
      <header
        data-tauri-drag-region={OS_PLATFORM !== 'win32'}
        className='bg-background/80 sticky top-0 z-20 h-14 w-full shrink-0 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
      />

      <div className='mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-6'>
        <Card>
          <CardHeader>
            <CardTitle>{t('restoreDevice.title')}</CardTitle>

            <CardDescription>{t('restoreDevice.description')}</CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            {!searched && (
              <>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='restore-page-keyword'>
                    {t('restoreDevice.keywordLabel')}
                  </Label>

                  <Input
                    id='restore-page-keyword'
                    placeholder={t('restoreDevice.keywordPlaceholder')}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        void handleSearch();
                      }
                    }}
                  />

                  <p className='text-muted-foreground text-xs leading-relaxed'>
                    {t('restoreDevice.keywordHint')}
                  </p>
                </div>

                <div className='flex justify-end gap-2'>
                  <Button
                    disabled={!keyword.trim() || loading}
                    onClick={handleSearch}
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        {t('restoreDevice.searching')}
                      </>
                    ) : (
                      t('restoreDevice.next')
                    )}
                  </Button>
                </div>
              </>
            )}

            {searched && (
              <>
                {devices.length > 0 ? (
                  <div className='space-y-2'>
                    <div className='text-muted-foreground text-sm'>
                      {t('restoreDevice.selectDescription')}
                    </div>

                    <RadioGroup
                      value={selectedId}
                      onValueChange={setSelectedId}
                      className='max-h-120 gap-3 overflow-y-auto'
                    >
                      {devices.map((device) => (
                        <Label
                          key={device.id}
                          htmlFor={device.id}
                          className='hover:bg-accent flex cursor-pointer items-center gap-4 rounded-lg border p-4'
                        >
                          <RadioGroupItem id={device.id} value={device.id} />
                          <Avatar>
                            <AvatarImage
                              className='rounded-full'
                              src={resolveResourceUrl(device.avatar)}
                            />
                            <AvatarFallback className='rounded-full'>
                              <User />
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex-1'>
                            <div className='font-medium'>{device.name}</div>
                            <div className='text-muted-foreground mt-1 text-xs break-all'>
                              {device.id}
                            </div>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>

                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='outline'
                        onClick={() => {
                          setSearched(false);
                          setDevices([]);
                          setSelectedId(undefined);
                        }}
                      >
                        {t('restoreDevice.back')}
                      </Button>

                      <Button disabled={!selectedId} onClick={handleRestore}>
                        {t('restoreDevice.restore')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Empty>
                      <EmptyHeader>
                        <div className='flex items-center gap-2'>
                          <EmptyMedia variant='icon' className='mb-0'>
                            <FolderSearch />
                          </EmptyMedia>
                          <EmptyTitle>
                            {t('restoreDevice.notFoundTitle')}
                          </EmptyTitle>
                        </div>
                        <EmptyDescription>
                          {t('restoreDevice.notFoundDescription')}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>

                    <div className='flex justify-end'>
                      <Button
                        variant='outline'
                        onClick={() => {
                          setSearched(false);
                          setDevices([]);
                        }}
                      >
                        {t('restoreDevice.back')}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { RestorePage as Component };
