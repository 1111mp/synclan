import { ChevronRightIcon, CircleHelp } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  InputGroup,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  Separator,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { isWeb } from '@/lib/constant';
import { exportServerCert } from '@/services/cmd';

import type { SettingsForm } from './settings-schema';

function ServerSettings({ form }: { form: UseFormReturn<SettingsForm> }) {
  const { t } = useTranslation();

  if (isWeb) return null;

  const handleExportCertificate = async () => {
    try {
      await exportServerCert();

      toast.success('Certificate exported successfully.');
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : err instanceof Error
            ? err.message
            : 'Failed to export certificate.';

      toast.error(message);
    }
  };

  const certificateTrustHelp = (
    <>
      <strong>
        {OS_PLATFORM === 'darwin'
          ? t('settings.server.certificateTrustHelp.requiredMacOS')
          : OS_PLATFORM === 'linux'
            ? t('settings.server.certificateTrustHelp.requiredLinux')
            : t('settings.server.certificateTrustHelp.requiredHttps')}
      </strong>

      <br />

      {OS_PLATFORM === 'darwin'
        ? t('settings.server.certificateTrustHelp.macOS')
        : OS_PLATFORM === 'linux'
          ? t('settings.server.certificateTrustHelp.linux')
          : t('settings.server.certificateTrustHelp.default')}
    </>
  );

  return (
    <FieldSet>
      <FieldLegend className='text-muted-foreground pl-3'>
        {t('settings.server.title')}
      </FieldLegend>
      <div className='overflow-hidden rounded-xl'>
        <FieldGroup className='gap-0'>
          <Controller
            name='http_server_port'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='http_server_port'>
                  <Item
                    variant='muted'
                    size='sm'
                    className='hover:bg-muted rounded-none'
                  >
                    <ItemContent>
                      <ItemTitle>
                        {t('settings.server.httpServerPort')}
                      </ItemTitle>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </ItemContent>
                    <ItemActions>
                      <InputGroup className='h-6'>
                        <InputGroupInput
                          id='http_server_port'
                          type='number'
                          min={1}
                          className='w-20'
                          value={field.value}
                          onChange={(evt) => {
                            field.onChange(evt.target.valueAsNumber);
                          }}
                        />
                      </InputGroup>
                    </ItemActions>
                  </Item>
                </FieldLabel>
              </Field>
            )}
          />
          <Separator />
          <Controller
            name='enable_encryption'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor='synclan-enable-encryption'
                  className='has-data-checked:bg-transparent dark:has-data-checked:bg-transparent'
                >
                  <Item
                    variant='muted'
                    className='hover:bg-muted rounded-none py-3'
                  >
                    <ItemContent>
                      <ItemTitle>
                        {t('settings.server.enableHttps')}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CircleHelp className='text-muted-foreground h-4 w-4 cursor-help' />
                          </TooltipTrigger>
                          <TooltipContent className='max-w-md'>
                            <p className='text-sm'>{certificateTrustHelp}</p>
                          </TooltipContent>
                        </Tooltip>
                      </ItemTitle>

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </ItemContent>
                    <ItemActions>
                      <Switch
                        id='synclan-enable-encryption'
                        name={field.name}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-invalid={fieldState.invalid}
                      />
                    </ItemActions>
                  </Item>
                </FieldLabel>
              </Field>
            )}
          />
          <Separator />
          <Item
            variant='muted'
            className='hover:bg-muted rounded-none py-3'
            onClick={handleExportCertificate}
          >
            <ItemContent>
              <ItemTitle>
                {t('settings.server.exportCertificate')}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CircleHelp className='text-muted-foreground h-4 w-4 cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-md'>
                    <p className='text-sm'>{certificateTrustHelp}</p>
                  </TooltipContent>
                </Tooltip>
              </ItemTitle>
            </ItemContent>
            <ItemActions>
              <ChevronRightIcon className='size-4' />
            </ItemActions>
          </Item>
        </FieldGroup>
      </div>
    </FieldSet>
  );
}

export { ServerSettings };
