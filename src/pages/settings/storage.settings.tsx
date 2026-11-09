import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { HardDrive, ChevronRightIcon } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { SettingsSection } from '@/components/settings-section';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Field,
  FieldError,
  FieldGroup,
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { isWeb } from '@/lib/constant';

import type { SettingsForm } from './settings-schema';

const AUTO_FILE_CLEANUP = ['0', '1', '2', '3', '4'];

function StorageSettings({ form }: { form: UseFormReturn<SettingsForm> }) {
  const { t } = useTranslation();

  if (isWeb) return null;

  return (
    <SettingsSection
      title={t('settings.storage.title')}
      description={t('settings.storage.description')}
      icon={HardDrive}
    >
      <FieldGroup className='gap-0'>
        <Controller
          name='file_upload_dir'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Item
                asChild
                variant='default'
                size='sm'
                className='hover:bg-muted/50 min-h-14 rounded-none px-5 py-3.5'
                onClick={async (evt) => {
                  evt.preventDefault();
                  const path = await openDialog({
                    title: t('Directory-Select'),
                    directory: true,
                  });

                  if (path) {
                    field.onChange(path);
                  }
                }}
              >
                <button type='button' className='w-full text-left'>
                  <ItemContent>
                    <ItemTitle>
                      {t('settings.storage.uploadDirectory')}
                    </ItemTitle>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </ItemContent>
                  <ItemActions>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className='text-muted-foreground max-w-32 truncate sm:max-w-52'
                          aria-invalid={fieldState.invalid}
                        >
                          {field.value}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className='break-all'>
                        {field.value}
                      </TooltipContent>
                    </Tooltip>
                    <ChevronRightIcon className='size-4' />
                  </ItemActions>
                </button>
              </Item>
            </Field>
          )}
        />
        <Separator />
        <Controller
          name='auto_file_clean'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Item
                    variant='default'
                    size='sm'
                    className='hover:bg-muted/50 min-h-14 rounded-none px-5 py-3.5'
                    asChild
                  >
                    <button type='button' className='w-full text-left'>
                      <ItemContent>
                        <ItemTitle>
                          {t('settings.storage.autoFileCleanup')}
                        </ItemTitle>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </ItemContent>
                      <ItemActions>
                        <span
                          className='text-muted-foreground'
                          aria-invalid={fieldState.invalid}
                        >
                          {t(`settings.log.autoClean.${field.value}`)}
                        </span>
                        <ChevronRightIcon className='size-4' />
                      </ItemActions>
                    </button>
                  </Item>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-fit' align='end'>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      {AUTO_FILE_CLEANUP.map((val) => (
                        <DropdownMenuRadioItem key={val} value={val}>
                          {t(`settings.log.autoClean.${val}`)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </Field>
          )}
        />
      </FieldGroup>
    </SettingsSection>
  );
}

export { StorageSettings };
