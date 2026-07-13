import { Controller, type UseFormReturn } from 'react-hook-form';

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
} from '@/components/ui';
import { isWeb } from '@/lib/constant';

import type { SettingsForm } from './settings-schema';

function ServerSettings({ form }: { form: UseFormReturn<SettingsForm> }) {
  if (isWeb) return null;

  return (
    <FieldSet>
      <FieldLegend className='text-muted-foreground pl-3'>Server</FieldLegend>
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
                    className='hover:bg-muted rounded-none transition-colors'
                  >
                    <ItemContent>
                      <ItemTitle>HTTP Server Port</ItemTitle>
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
                    className='hover:bg-muted rounded-none py-3 transition-colors'
                  >
                    <ItemContent>
                      <ItemTitle>Enable HTTPS</ItemTitle>
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
        </FieldGroup>
      </div>
    </FieldSet>
  );
}

export { ServerSettings };
