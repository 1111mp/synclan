import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { ChevronRightIcon } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

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
  FieldLegend,
  FieldSet,
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
    <FieldSet>
      <FieldLegend className='text-muted-foreground pl-3'>Storage</FieldLegend>
      <div className='overflow-hidden rounded-xl'>
        <FieldGroup className='gap-0'>
          <Controller
            name='file_upload_dir'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Item
                  variant='muted'
                  size='sm'
                  className='hover:bg-muted rounded-none py-3 transition-colors'
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
                  <ItemContent>
                    <ItemTitle>Upload Directory</ItemTitle>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </ItemContent>
                  <ItemActions>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className='text-muted-foreground max-w-52 truncate'
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
                      variant='muted'
                      size='sm'
                      className='hover:bg-muted rounded-none py-3 transition-colors'
                    >
                      <ItemContent>
                        <ItemTitle>Auto File Cleanup</ItemTitle>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </ItemContent>
                      <ItemActions>
                        <span
                          className='text-muted-foreground'
                          aria-invalid={fieldState.invalid}
                        >
                          {t(`auto_log_clean_${field.value}`)}
                        </span>
                        <ChevronRightIcon className='size-4' />
                      </ItemActions>
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
                            {t(`auto_log_clean_${val}`)}
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
      </div>
    </FieldSet>
  );
}

export { StorageSettings };
