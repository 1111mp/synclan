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
  FieldLabel,
  FieldLegend,
  FieldSet,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  Separator,
} from '@/components/ui';
import { isWeb } from '@/lib/constant';

import type { SettingsForm } from './settings-schema';

const LOG_LEVELS = {
  silent: 'Silent',
  error: 'Error',
  warn: 'Warn',
  info: 'Info',
  debug: 'Debug',
  trace: 'Trace',
};
const AUTO_LOG_CLEAN = ['0', '1', '2', '3', '4'];

function LoggerSettings({ form }: { form: UseFormReturn<SettingsForm> }) {
  const { t } = useTranslation();

  if (isWeb) return null;

  return (
    <FieldSet>
      <FieldLegend className='text-muted-foreground pl-3'>Log</FieldLegend>
      <div className='overflow-hidden rounded-xl'>
        <FieldGroup className='gap-0'>
          <Controller
            name='app_log_level'
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
                        <ItemTitle>Log Level</ItemTitle>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </ItemContent>
                      <ItemActions>
                        <span
                          className='text-muted-foreground'
                          aria-invalid={fieldState.invalid}
                        >
                          {LOG_LEVELS[field.value]}
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
                        {Object.entries(LOG_LEVELS).map(([value, label]) => (
                          <DropdownMenuRadioItem key={value} value={value}>
                            {label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Field>
            )}
          />
          <Separator />
          <Controller
            name='auto_log_clean'
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
                        <ItemTitle>Log Cleanup</ItemTitle>
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
                        {AUTO_LOG_CLEAN.map((val) => (
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
          <Separator />
          <Controller
            name='app_log_max_size'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='app_log_max_size'>
                  <Item
                    variant='muted'
                    size='sm'
                    className='hover:bg-muted rounded-none transition-colors'
                  >
                    <ItemContent>
                      <ItemTitle>Max Log Size</ItemTitle>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </ItemContent>
                    <ItemActions>
                      <InputGroup className='h-6'>
                        <InputGroupInput
                          id='app_log_max_size'
                          type='number'
                          min={1}
                          className='w-20'
                          value={field.value}
                          onChange={(evt) => {
                            field.onChange(evt.target.valueAsNumber);
                          }}
                        />
                        <InputGroupAddon align='inline-end'>
                          <FieldLabel>KB</FieldLabel>
                        </InputGroupAddon>
                      </InputGroup>
                    </ItemActions>
                  </Item>
                </FieldLabel>
              </Field>
            )}
          />
          <Separator />
          <Controller
            name='app_log_max_count'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='app_log_max_count'>
                  <Item
                    variant='muted'
                    size='sm'
                    className='hover:bg-muted rounded-none transition-colors'
                  >
                    <ItemContent>
                      <ItemTitle>Max Log Count</ItemTitle>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </ItemContent>
                    <ItemActions>
                      <InputGroup className='h-6'>
                        <InputGroupInput
                          id='app_log_max_count'
                          type='number'
                          min={1}
                          className='w-20'
                          value={field.value}
                          onChange={(evt) => {
                            field.onChange(evt.target.valueAsNumber);
                          }}
                        />
                        <InputGroupAddon align='inline-end'>
                          <FieldLabel>File</FieldLabel>
                        </InputGroupAddon>
                      </InputGroup>
                    </ItemActions>
                  </Item>
                </FieldLabel>
              </Field>
            )}
          />
        </FieldGroup>
      </div>
    </FieldSet>
  );
}

export { LoggerSettings };
