import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Check, Copy, User } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from 'motion/react';
import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useImagePreview } from '@/components';
import { SettingsSection } from '@/components/settings-section';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui';
import { PROFILE_AVATAR_GROUPS } from '@/lib/avatar';
import { resolveResourceUrl } from '@/lib/utils';
import { z } from '@/lib/zod';
import {
  onPickImage,
  updateDeviceProfile,
  type DevicePatch,
} from '@/services/cmd';
import { useDeviceStore } from '@/stores';

function loader() {}

const formSchema = z.object({
  avatar: z.string().optional().nullable(),
  name: z.string().min(1).max(24),
});

function AvatarPickerTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const isPresent = useIsPresent();

  return (
    <motion.fieldset
      className='w-full min-w-0 overflow-hidden'
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeInOut' }}
      // AnimatePresence retains exiting content; prevent edits during the collapse.
      disabled={!isPresent}
      inert={!isPresent}
      aria-hidden={!isPresent}
    >
      {children}
    </motion.fieldset>
  );
}

function ProfilePage() {
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);

  const current = useDeviceStore((s) => s.current);
  const updateCurrent = useDeviceStore((s) => s.updateCurrent);

  const { t } = useTranslation();
  const { openPreview } = useImagePreview();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      avatar: current?.avatar,
      name: current?.name,
    },
  });

  const onEdit = async () => {
    if (!isEdit) {
      form.reset({ avatar: current?.avatar, name: current?.name });
      setIsEdit(true);
      return;
    }
    await form.handleSubmit(onSubmit)();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!current?.id) return;

    const patch: DevicePatch = {};

    if (values.avatar && values.avatar !== current.avatar) {
      patch.avatar = values.avatar;
    }

    if (values.name && values.name !== current.name) {
      patch.name = values.name;
    }

    if (Object.keys(patch).length === 0) {
      setIsEdit(false);
      return;
    }

    try {
      const device = await updateDeviceProfile(current?.id, patch);

      updateCurrent(device);
      setIsEdit(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('profile.uploadFailed'),
      );
    }
  };

  const disabled = !isEdit;

  return (
    <div className='bg-background h-full min-h-0 w-full overflow-y-auto'>
      <header
        data-tauri-drag-region={OS_PLATFORM !== 'win32'}
        className='bg-background/95 border-border/50 sticky top-0 z-20 flex h-14 items-center border-b px-6 backdrop-blur-sm'
      >
        <div className='mx-auto flex w-full max-w-4xl items-center justify-between gap-4 pl-8'>
          <h1 className='text-sm font-medium'>{t('profile.profile')}</h1>
          <Button
            variant={isEdit ? 'default' : 'outline'}
            onClick={onEdit}
            disabled={isUploading || form.formState.isSubmitting}
          >
            {isEdit ? t('profile.done') : t('profile.edit')}
          </Button>
        </div>
      </header>
      <div className='@container mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10'>
        <form id='form-synclan-profile' aria-disabled={disabled}>
          <FieldGroup className='gap-8 pb-8'>
            <Controller
              name='avatar'
              disabled={disabled}
              control={form.control}
              render={({ field }) => {
                const avatarUrl = resolveResourceUrl(
                  isEdit ? field.value : current?.avatar,
                );
                return (
                  <FieldGroup className='gap-8'>
                    <div className='flex items-start gap-4 sm:gap-5'>
                      <button
                        type='button'
                        onClick={() => openPreview([avatarUrl], 0)}
                        aria-label={t('profile.previewAvatar')}
                        className='focus-visible:ring-ring focus-visible:ring-offset-background shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-4'
                      >
                        <Avatar className='size-16 overflow-hidden sm:size-20'>
                          <AvatarImage
                            src={avatarUrl}
                            alt={current?.name ?? t('profile.profile')}
                          />
                          <AvatarFallback>
                            <User />
                          </AvatarFallback>
                        </Avatar>
                      </button>
                      <div className='flex min-w-0 flex-1 flex-col items-start gap-2'>
                        <h2 className='text-xl font-semibold tracking-tight break-words'>
                          {current?.name ?? t('profile.profile')}
                        </h2>
                        <p className='text-muted-foreground text-sm leading-relaxed'>
                          {t('profile.description')}
                        </p>
                        <button
                          type='button'
                          aria-label={t('manage.copyDeviceId')}
                          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring flex max-w-full items-center gap-2 rounded-md text-xs transition-colors outline-none focus-visible:ring-2'
                          onClick={async () => {
                            if (current?.id) {
                              await navigator.clipboard.writeText(current.id);
                              toast.success(t('profile.idCopied'));
                            }
                          }}
                        >
                          <span className='truncate font-mono'>
                            ID: {current?.id}
                          </span>
                          <Copy
                            className='size-3 shrink-0'
                            aria-hidden='true'
                          />
                        </button>
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {!disabled && (
                        <AvatarPickerTransition key='avatar-picker'>
                          <SettingsSection
                            title={t('profile.chooseAvatar')}
                            description={t('profile.avatarDescription')}
                            icon={Camera}
                          >
                            <div className='@container'>
                              <RadioGroup
                                aria-label={t('profile.chooseAvatar')}
                                value={
                                  PROFILE_AVATAR_GROUPS.map((group) =>
                                    group.avatars.find(
                                      (avatar) => avatar.url === avatarUrl,
                                    ),
                                  ).find(Boolean)?.value ?? ''
                                }
                                onValueChange={field.onChange}
                                className='gap-5 p-4'
                                disabled={
                                  isUploading || form.formState.isSubmitting
                                }
                              >
                                {PROFILE_AVATAR_GROUPS.map(
                                  (group, groupIndex) => (
                                    <FieldSet key={group.id} className='gap-3'>
                                      <FieldLegend
                                        variant='label'
                                        className='text-muted-foreground'
                                      >
                                        {group.label}
                                      </FieldLegend>
                                      <div className='grid grid-cols-4 justify-items-center gap-4 @min-[36rem]:grid-cols-8 @min-[36rem]:gap-3'>
                                        {group.avatars.map((avatar, index) => (
                                          <div
                                            data-avatar-option
                                            key={avatar.value}
                                            className='group/avatar-option has-data-[state=checked]:ring-primary has-focus-visible:outline-ring relative flex cursor-pointer items-center justify-center rounded-full p-1 ring-2 ring-transparent transition-shadow has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4'
                                          >
                                            <Avatar className='size-12 overflow-hidden transition-transform group-hover/avatar-option:scale-105'>
                                              <AvatarImage
                                                src={avatar.url}
                                                alt=''
                                              />
                                              <AvatarFallback>
                                                <User />
                                              </AvatarFallback>
                                            </Avatar>
                                            <RadioGroupItem
                                              className='absolute inset-0 size-full cursor-pointer opacity-0 after:hidden'
                                              value={avatar.value}
                                              aria-label={t(
                                                'profile.avatarOption',
                                                {
                                                  number:
                                                    groupIndex * 8 + index + 1,
                                                },
                                              )}
                                            />
                                            {avatar.url === avatarUrl && (
                                              <span
                                                className='bg-primary text-primary-foreground ring-background pointer-events-none absolute right-0 bottom-0 flex size-4 items-center justify-center rounded-full ring-2'
                                                aria-hidden='true'
                                              >
                                                <Check
                                                  className='size-3'
                                                  strokeWidth={3}
                                                />
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </FieldSet>
                                  ),
                                )}
                              </RadioGroup>
                              <Button
                                type='button'
                                variant='ghost'
                                className='border-border/50 w-full rounded-none border-t py-5'
                                disabled={
                                  isUploading || form.formState.isSubmitting
                                }
                                onClick={async () => {
                                  setIsUploading(true);
                                  try {
                                    const url = await onPickImage();
                                    if (url) field.onChange(url);
                                  } catch (error) {
                                    toast.error(
                                      error instanceof Error
                                        ? error.message
                                        : t('profile.uploadFailed'),
                                    );
                                  } finally {
                                    setIsUploading(false);
                                  }
                                }}
                              >
                                <Camera data-icon='inline-start' />
                                {t(
                                  isUploading
                                    ? 'profile.uploading'
                                    : 'profile.uploadAvatar',
                                )}
                              </Button>
                            </div>
                          </SettingsSection>
                        </AvatarPickerTransition>
                      )}
                    </AnimatePresence>
                  </FieldGroup>
                );
              }}
            />
            <div className='border-border/50 border-t pt-8'>
              <SettingsSection
                title={t('profile.details')}
                description={t('profile.detailsDescription')}
                icon={User}
              >
                <Controller
                  name='name'
                  disabled={disabled}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className='p-5'>
                      <FieldLabel htmlFor='synclan-profile-name'>
                        {t('profile.name')}
                      </FieldLabel>
                      <Input
                        {...field}
                        value={
                          isEdit ? (field.value ?? '') : (current?.name ?? '')
                        }
                        disabled={disabled || form.formState.isSubmitting}
                        id='synclan-profile-name'
                        aria-invalid={fieldState.invalid}
                        maxLength={24}
                        autoComplete='username'
                        className='disabled:opacity-100'
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </SettingsSection>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

export { ProfilePage as Component, loader };
