import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useEffectEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FieldGroup } from '@/components/ui';
import { isWeb } from '@/lib/constant';
import { applyPendingTheme } from '@/lib/utils';
import { useSynclanStore } from '@/stores';

import { AppearanceSettings } from './appearance-settings';
import { GeneralSettings } from './general-settings';
import { LoggerSettings } from './logger-settings';
import { ServerSettings } from './server-settings';
import { formSchema, type SettingsForm } from './settings-schema';
import { StorageSettings } from './storage.settings';

function loader() {}

function SettingsPage() {
  const config = useSynclanStore((s) => s.config);
  const updateConfig = useSynclanStore((s) => s.updateConfig);

  const { i18n } = useTranslation();

  const form = useForm<SettingsForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      theme: config?.theme ?? 'system',
      locale: config?.locale ?? 'en',

      ...(!isWeb
        ? {
            auto_check_update: config?.auto_check_update ?? true,
            enable_auto_launch: config?.enable_auto_launch ?? false,
            enable_silent_start: config?.enable_silent_start ?? false,
            // server
            http_server_port: config?.http_server_port ?? 53317,
            enable_encryption: config?.enable_encryption ?? false,
            // storage
            file_upload_dir: config?.file_upload_dir,
            auto_file_clean: `${config?.auto_file_clean ?? 0}`,
            // log
            app_log_level: config?.app_log_level ?? 'info',
            auto_log_clean: `${config?.auto_log_clean ?? 0}`,
            app_log_max_size: config?.app_log_max_size ?? 128,
            app_log_max_count: config?.app_log_max_count ?? 8,
          }
        : {}),
    },
  });

  const { watch } = form;

  useEffect(() => {
    const subscription = watch(() => {
      void form.handleSubmit(onSubmit)();
    });

    return () => subscription.unsubscribe();
  }, [watch, form]);

  const onSubmit = useEffectEvent(async (values: SettingsForm) => {
    const settings: ISynclanConfig = {
      locale: values.locale,
      theme: values.theme,
    };

    if ('auto_check_update' in values) {
      Object.assign(settings, {
        auto_check_update: values.auto_check_update,
        enable_auto_launch: values.enable_auto_launch,
        enable_silent_start: values.enable_silent_start,
        // server
        http_server_port: values.http_server_port,
        enable_encryption: values.enable_encryption,
        // storage
        file_upload_dir: values.file_upload_dir,
        auto_file_clean: parseInt(
          values.auto_file_clean,
        ) as ISynclanConfig['auto_file_clean'],
        // log
        app_log_level: values.app_log_level,
        auto_log_clean: parseInt(
          values.auto_log_clean,
        ) as ISynclanConfig['auto_log_clean'],
        app_log_max_size: values.app_log_max_size,
        app_log_max_count: values.app_log_max_count,
      });
    }

    if (settings.locale && settings.locale !== config?.locale) {
      await i18n.changeLanguage(settings.locale);
    }

    if (settings.theme && settings.theme !== config?.theme) {
      await applyPendingTheme(settings.theme);
    }

    updateConfig(settings);
  });

  return (
    <div className='h-dvh w-full overflow-y-auto'>
      <header
        data-tauri-drag-region
        className='bg-background/80 sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-center gap-2 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
      >
        Settings
      </header>
      <div className='mx-auto min-h-full max-w-2xl px-4'>
        <form id='form-synclan-settings'>
          <FieldGroup className='py-6'>
            <GeneralSettings form={form} />
            <AppearanceSettings form={form} />
            <ServerSettings form={form} />
            <StorageSettings form={form} />
            <LoggerSettings form={form} />
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

export { SettingsPage as Component, loader };
