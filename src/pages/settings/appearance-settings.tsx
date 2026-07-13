import { ChevronRightIcon, MoonStar, Sun, SunMoon } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';

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
} from '@/components/ui';

import type { SettingsForm } from './settings-schema';

const THEMES = {
  system: 'System',
  dark: 'Dark',
  light: 'Light',
};

function AppearanceSettings({ form }: { form: UseFormReturn<SettingsForm> }) {
  return (
    <FieldSet>
      <FieldLegend className='text-muted-foreground pl-3'>
        Appearance
      </FieldLegend>
      <FieldGroup>
        <Controller
          name='theme'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Item
                    variant='muted'
                    size='sm'
                    className='hover:bg-muted py-3 transition-colors'
                  >
                    <ItemContent>
                      <ItemTitle>Theme</ItemTitle>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </ItemContent>
                    <ItemActions>
                      <span
                        className='text-muted-foreground'
                        aria-invalid={fieldState.invalid}
                      >
                        {THEMES[field.value]}
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
                      <DropdownMenuRadioItem value='system'>
                        <SunMoon className='size-5' />
                        System
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='dark'>
                        <MoonStar className='size-5' />
                        Dark
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value='light'>
                        <Sun className='size-5' />
                        Light
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </Field>
          )}
        />
      </FieldGroup>
    </FieldSet>
  );
}

export { AppearanceSettings };
