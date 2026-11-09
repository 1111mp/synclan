import { check } from '@tauri-apps/plugin-updater';
import { Info, ChevronRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SettingsSection } from '@/components/settings-section';
import {
  FieldGroup,
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  Separator,
  Spinner,
} from '@/components/ui';
import { isWeb } from '@/lib/constant';
import { copyText } from '@/lib/utils/copy-text';
import { getAppVersion } from '@/services/api';
import { useUpdaterStore } from '@/stores';

function AboutSettings() {
  const [version, setVersion] = useState<string>('');

  const { t } = useTranslation();

  useEffect(() => {
    void getAppVersion().then(setVersion);
  }, []);

  return (
    <SettingsSection
      title={t('settings.about.title')}
      description={t('settings.about.description')}
      icon={Info}
    >
      <FieldGroup className='gap-0'>
        {!isWeb && (
          <>
            <CheckForUpdatesItem />
            <Separator />
          </>
        )}
        <Item
          asChild
          variant='default'
          size='sm'
          className='hover:bg-muted/50 min-h-14 rounded-none px-5 py-3.5'
          onClick={async () => {
            try {
              await copyText(version);
              toast.success(t('settings.about.versionCopied'));
            } catch {
              toast.error(t('settings.about.versionCopyFailed'));
            }
          }}
        >
          <button type='button' className='w-full text-left'>
            <ItemContent>
              <ItemTitle>Synclan {t('settings.about.version')}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <span className='text-muted-foreground'>v{version}</span>
              <ChevronRightIcon className='size-4' />
            </ItemActions>
          </button>
        </Item>
      </FieldGroup>
    </SettingsSection>
  );
}

function CheckForUpdatesItem() {
  const [loading, setLoading] = useState<boolean>(false);

  const { t } = useTranslation();

  const checkForUpdates = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const update = await check();
      if (update) {
        const store = useUpdaterStore.getState();
        store.setUpdate(update);
        store.setOpen(true);
      } else {
        toast.success(t('updater.upToDate'));
      }
    } catch {
      toast.error(t('updater.failedToCheck'), {
        description: t('updater.checkFailedDescription'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Item
      asChild
      variant='default'
      size='sm'
      className='hover:bg-muted/50 min-h-14 rounded-none px-5 py-3.5'
      onClick={checkForUpdates}
    >
      <button type='button' className='w-full text-left'>
        <ItemContent>
          <ItemTitle>{t('settings.about.checkForUpdates')}</ItemTitle>
        </ItemContent>
        <ItemActions>
          <span className='text-muted-foreground'>
            {t('settings.about.checkNow')}
          </span>
          {loading ? <Spinner /> : <ChevronRightIcon className='size-4' />}
        </ItemActions>
      </button>
    </Item>
  );
}

export { AboutSettings };
