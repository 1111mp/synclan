import { check } from '@tauri-apps/plugin-updater';
import { ChevronRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  FieldGroup,
  FieldLegend,
  FieldSet,
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  Separator,
  Spinner,
} from '@/components/ui';
import { isWeb } from '@/lib/constant';
import { getUpdateTarget } from '@/lib/updater';
import { getAppVersion } from '@/services/api';
import { useUpdaterStore } from '@/stores';

function AboutSettings() {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    void getAppVersion().then(setVersion);
  }, []);

  return (
    <FieldSet>
      <FieldLegend className='text-muted-foreground pl-3'>About</FieldLegend>
      <div className='overflow-hidden rounded-xl'>
        <FieldGroup className='gap-0'>
          {!isWeb && (
            <>
              <CheckForUpdatesItem />
              <Separator />
            </>
          )}
          <Item
            variant='muted'
            size='sm'
            className='hover:bg-muted rounded-none py-3'
            onClick={async () => {
              await navigator.clipboard.writeText(version);
              toast.success('Version copied to clipboard');
            }}
          >
            <ItemContent>
              <ItemTitle>Synclan Version</ItemTitle>
            </ItemContent>
            <ItemActions>
              <span className='text-muted-foreground'>v{version}</span>
              <ChevronRightIcon className='size-4' />
            </ItemActions>
          </Item>
        </FieldGroup>
      </div>
    </FieldSet>
  );
}

function CheckForUpdatesItem() {
  const [loading, setLoading] = useState<boolean>(false);

  const checkForUpdates = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const version = await getAppVersion();
      const update = await check({
        target: getUpdateTarget(version),
      });
      if (update) {
        const store = useUpdaterStore.getState();
        store.setUpdate(update);
        store.setOpen(true);
      } else {
        toast.success('You are already using the latest version');
      }
    } catch {
      toast.error('Failed to check for updates', {
        description: 'Please check your network connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Item
      variant='muted'
      size='sm'
      className='hover:bg-muted rounded-none py-3'
      onClick={checkForUpdates}
    >
      <ItemContent>
        <ItemTitle>Check for Updates</ItemTitle>
      </ItemContent>
      <ItemActions>
        <span className='text-muted-foreground'>Check Now</span>
        {loading ? <Spinner /> : <ChevronRightIcon className='size-4' />}
      </ItemActions>
    </Item>
  );
}

export { AboutSettings };
