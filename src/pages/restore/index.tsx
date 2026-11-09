import {
  Check,
  ChevronRight,
  FolderSearch,
  RotateCcw,
  Search,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SettingsSection } from '@/components/settings-section';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  RadioGroup,
  RadioGroupItem,
  Spinner,
} from '@/components/ui';
import { DEVICE_ID_STORAGE_KEY } from '@/lib/device';
import { cn, resolveResourceUrl } from '@/lib/utils';
import { searchRestoreDevice } from '@/services/cmd';

function RestorePage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [searchError, setSearchError] = useState<string>();
  const { t } = useTranslation();

  const handleSearch = async () => {
    const value = keyword.trim();
    if (!value || loading) return;
    setLoading(true);
    setSearchError(undefined);
    try {
      const result = await searchRestoreDevice(value);
      setDevices(result);
      setSelectedId(result.length === 1 ? result[0].id : undefined);
      setSearched(true);
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : t('restoreDevice.searchFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = () => {
    if (!selectedId || restoring) return;
    setRestoring(true);
    try {
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, selectedId);
      window.location.href = '/';
    } catch {
      toast.error(t('restoreDevice.restoreFailed'));
      setRestoring(false);
    }
  };

  const handleBack = () => {
    setSearched(false);
    setDevices([]);
    setSelectedId(undefined);
  };

  return (
    <div className='bg-background h-full min-h-0 w-full overflow-y-auto'>
      <header
        data-tauri-drag-region={OS_PLATFORM !== 'win32'}
        className='bg-background/95 border-border/50 sticky top-0 z-20 flex h-14 items-center border-b px-6 backdrop-blur-sm'
      >
        <div className='mx-auto flex w-full max-w-4xl items-center pl-8'>
          <h1 className='text-sm font-medium'>{t('restoreDevice.title')}</h1>
        </div>
      </header>
      <div className='@container mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10'>
        <div className='mb-8 flex items-start gap-4'>
          <span className='bg-muted border-border/60 flex size-11 shrink-0 items-center justify-center rounded-2xl border'>
            <RotateCcw className='size-5' aria-hidden='true' />
          </span>
          <div className='flex min-w-0 flex-col gap-1.5'>
            <p className='text-xl font-semibold tracking-tight'>
              {t('restoreDevice.heading')}
            </p>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              {t('restoreDevice.description')}
            </p>
          </div>
        </div>
        <ol
          aria-label={t('restoreDevice.steps')}
          className='text-muted-foreground mb-8 flex items-center gap-3 text-xs'
        >
          <li
            aria-current={!searched ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2',
              !searched && 'text-foreground',
            )}
          >
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border border-border',
                !searched && 'bg-foreground text-background border-transparent',
              )}
            >
              {searched ? <Check className='size-3' aria-hidden='true' /> : '1'}
            </span>
            {t('restoreDevice.searchStep')}
          </li>
          <ChevronRight className='size-3 shrink-0' aria-hidden='true' />
          <li
            aria-current={searched ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2',
              searched && 'text-foreground',
            )}
          >
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border border-border',
                searched && 'bg-foreground text-background border-transparent',
              )}
            >
              2
            </span>
            {t('restoreDevice.selectStep')}
          </li>
        </ol>
        {!searched ? (
          <SettingsSection
            title={t('restoreDevice.searchTitle')}
            description={t('restoreDevice.keywordHint')}
            icon={Search}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSearch();
              }}
              className='p-5'
            >
              <FieldGroup className='gap-5'>
                <Field data-invalid={Boolean(searchError)}>
                  <FieldLabel htmlFor='restore-page-keyword'>
                    {t('restoreDevice.keywordLabel')}
                  </FieldLabel>
                  <Input
                    id='restore-page-keyword'
                    placeholder={t('restoreDevice.keywordPlaceholder')}
                    value={keyword}
                    disabled={loading}
                    aria-invalid={Boolean(searchError)}
                    aria-describedby={
                      searchError ? 'restore-search-error' : undefined
                    }
                    onChange={(event) => {
                      setKeyword(event.target.value);
                      setSearchError(undefined);
                    }}
                  />
                  {searchError && (
                    <FieldError id='restore-search-error'>
                      {searchError}
                    </FieldError>
                  )}
                </Field>
                <div className='flex justify-end'>
                  <Button
                    type='submit'
                    disabled={!keyword.trim() || loading}
                    className='w-full sm:w-auto'
                  >
                    {loading ? (
                      <Spinner data-icon='inline-start' />
                    ) : (
                      <Search data-icon='inline-start' />
                    )}
                    {t(
                      loading
                        ? 'restoreDevice.searching'
                        : 'restoreDevice.search',
                    )}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </SettingsSection>
        ) : (
          <SettingsSection
            title={t('restoreDevice.selectTitle')}
            description={t('restoreDevice.selectDescription')}
            icon={FolderSearch}
          >
            {devices.length > 0 ? (
              <RadioGroup
                aria-label={t('restoreDevice.selectTitle')}
                value={selectedId ?? ''}
                onValueChange={setSelectedId}
                disabled={restoring}
                className='divide-border/60 max-h-[min(28rem,50dvh)] gap-0 divide-y overflow-y-auto'
              >
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className='hover:bg-muted/50 has-data-[state=checked]:bg-accent/40 has-focus-visible:ring-ring relative flex min-w-0 items-center gap-3 p-5 has-focus-visible:ring-2 has-focus-visible:ring-inset'
                  >
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
                      <span className='text-sm font-medium break-words'>
                        {device.name}
                      </span>
                      <span className='text-muted-foreground font-mono text-xs break-all'>
                        {device.id}
                      </span>
                    </div>
                    <RadioGroupItem
                      value={device.id}
                      aria-label={`${device.name} (${device.id})`}
                      className='absolute inset-0 size-full cursor-pointer rounded-none opacity-0 after:hidden disabled:opacity-0'
                    />
                    {selectedId === device.id && (
                      <Check className='size-4 shrink-0' aria-hidden='true' />
                    )}
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Empty className='py-10'>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <FolderSearch />
                  </EmptyMedia>
                  <EmptyTitle>{t('restoreDevice.notFoundTitle')}</EmptyTitle>
                  <EmptyDescription>
                    {t('restoreDevice.notFoundDescription')}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            <div className='border-border/60 flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end'>
              <Button
                variant='outline'
                onClick={handleBack}
                disabled={restoring}
              >
                {t('restoreDevice.back')}
              </Button>
              {devices.length > 0 && (
                <Button
                  disabled={!selectedId || restoring}
                  onClick={handleRestore}
                >
                  {restoring ? (
                    <Spinner data-icon='inline-start' />
                  ) : (
                    <RotateCcw data-icon='inline-start' />
                  )}
                  {t('restoreDevice.restore')}
                </Button>
              )}
            </div>
          </SettingsSection>
        )}
      </div>
    </div>
  );
}

export { RestorePage as Component };
