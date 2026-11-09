import { Palette } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { SettingsSection } from '@/components/settings-section';
import { ThemeSelector } from '@/components/theme-selector';
import { Field, FieldError } from '@/components/ui';

import type { SettingsForm } from './settings-schema';

function AppearanceSettings({ form }: { form: UseFormReturn<SettingsForm> }) {
  const { t } = useTranslation();

  return (
    <SettingsSection
      title={t('settings.appearance.title')}
      description={t('settings.appearance.description')}
      icon={Palette}
    >
      <Controller
        name='theme'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className='p-4'>
            <ThemeSelector value={field.value} onValueChange={field.onChange} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </SettingsSection>
  );
}

export { AppearanceSettings };
