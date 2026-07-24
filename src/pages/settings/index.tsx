import { zodResolver } from '@hookform/resolvers/zod';
import { Power } from 'lucide-react';
import { useEffect, useEffectEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useConfirm } from '@/components';
import { FieldGroup } from '@/components/ui';
import { isWeb } from '@/lib/constant';
import { applyPendingTheme, cn } from '@/lib/utils';
import { restartApp } from '@/services/cmd';
import { useSynclanStore } from '@/stores';

import { AboutSettings } from './about-settings';
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

  const confirm = useConfirm();
  const { i18n, t } = useTranslation();

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

    let restart: boolean = false;
    if (
      (settings.http_server_port !== undefined &&
        settings.http_server_port !== config?.http_server_port) ||
      (settings.enable_encryption !== undefined &&
        settings.enable_encryption !== config?.enable_encryption) ||
      (settings.file_upload_dir !== undefined &&
        settings.file_upload_dir !== config?.file_upload_dir)
    ) {
      restart = true;
    }

    await updateConfig(settings);

    if (!isWeb && restart) {
      const ok = await confirm({
        icon: <Power />,
        title: t('settings.restartSynclan'),
        description: t('settings.restartDescription'),
        confirmText: t('settings.restart'),
        actionVariant: 'destructive',
      });

      if (ok) {
        await restartApp();
      }
    }
  });

  return (
    <div className='h-dvh w-full overflow-y-auto'>
      <header
        data-tauri-drag-region={OS_PLATFORM !== 'win32'}
        className='bg-background/80 sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-center gap-2 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
      >
        {t('settings.title')}
      </header>
      <div
        className={cn(
          'mx-auto max-w-2xl px-4',
          OS_PLATFORM === 'darwin' && 'min-h-full',
        )}
      >
        <form id='form-synclan-settings'>
          <FieldGroup className='pb-6'>
            <GeneralSettings form={form} />
            <AppearanceSettings form={form} />
            <ServerSettings form={form} />
            <StorageSettings form={form} />
            <LoggerSettings form={form} />
            <AboutSettings />
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

export { SettingsPage as Component, loader };
