import { zodResolver } from '@hookform/resolvers/zod';
import { Power, SlidersHorizontal } from 'lucide-react';
import { useEffect, useEffectEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useConfirm } from '@/components';
import { PageHeader } from '@/components/page-header';
import { FieldGroup } from '@/components/ui';
import { isWeb } from '@/lib/constant';
import { applyPendingTheme } from '@/lib/utils';
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
    <div className='bg-background h-full min-h-0 w-full overflow-y-auto'>
      <PageHeader
        title={t('settings.title')}
        description={t('settings.autosave')}
      />
      <div className='@container mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10'>
        <div className='mb-10 flex items-start gap-4'>
          <span className='bg-muted border-border/60 flex size-11 shrink-0 items-center justify-center rounded-2xl border'>
            <SlidersHorizontal className='size-5' aria-hidden='true' />
          </span>
          <div className='flex flex-col gap-1.5'>
            <p className='text-xl font-semibold tracking-tight'>
              {t('settings.preferences')}
            </p>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              {t('settings.description')}
            </p>
          </div>
        </div>
        <form id='form-synclan-settings'>
          <FieldGroup className='[&>fieldset+fieldset]:border-border/50 gap-8 pb-8 [&>fieldset+fieldset]:border-t [&>fieldset+fieldset]:pt-8'>
            <AppearanceSettings form={form} />
            <GeneralSettings form={form} />
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
