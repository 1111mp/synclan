import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Check, ChevronRightIcon, User } from 'lucide-react';
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui';
import { PROFILE_AVATAR_GROUPS } from '@/lib/avatar';
import { cn, resolveResourceUrl } from '@/lib/utils';
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
    <div className='h-full min-h-0 w-full overflow-y-auto'>
      <header
        data-tauri-drag-region={OS_PLATFORM !== 'win32'}
        className='bg-card sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-end gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
      >
        <Button
          variant='outline'
          onClick={onEdit}
          disabled={isUploading || form.formState.isSubmitting}
        >
          {isEdit ? t('profile.done') : t('profile.edit')}
        </Button>
      </header>
      <div
        className={cn(
          'mx-auto max-w-2xl px-4 pt-4',
          OS_PLATFORM === 'darwin' && 'min-h-full',
        )}
      >
        <form id='form-synclan-profile' aria-disabled={disabled}>
          <FieldGroup className='pb-6'>
            <FieldGroup className='items-center gap-4'>
              <Controller
                name='avatar'
                disabled={disabled}
                control={form.control}
                render={({ field }) => {
                  const avatarUrl = resolveResourceUrl(
                    isEdit ? field.value : current?.avatar,
                  );
                  return (
                    <FieldGroup className='items-center gap-4'>
                      <Avatar
                        className='size-24 cursor-pointer overflow-hidden'
                        onClick={() => openPreview([avatarUrl], 0)}
                      >
                        <AvatarImage
                          src={avatarUrl}
                          alt={current?.name ?? t('profile.profile')}
                        />
                        <AvatarFallback>
                          <User />
                        </AvatarFallback>
                      </Avatar>
                      <p
                        className='text-muted-foreground max-w-full cursor-pointer text-center text-xs break-all'
                        onClick={async () => {
                          if (current?.id) {
                            await navigator.clipboard.writeText(current?.id);
                            toast.success(t('profile.idCopied'));
                          }
                        }}
                      >
                        ID: {current?.id}
                      </p>
                      <AnimatePresence initial={false}>
                        {!disabled && (
                          <AvatarPickerTransition key='avatar-picker'>
                            <FieldSet
                              disabled={
                                isUploading || form.formState.isSubmitting
                              }
                              className='w-full gap-2 pt-4'
                            >
                              <FieldLegend
                                className='text-muted-foreground pl-3'
                                id='profile-avatar-label'
                              >
                                {t('profile.chooseAvatar')}
                              </FieldLegend>
                              <div className='bg-muted/50 @container overflow-hidden rounded-xl'>
                                <RadioGroup
                                  aria-labelledby='profile-avatar-label'
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
                                      <FieldSet
                                        key={group.id}
                                        className='gap-3'
                                      >
                                        <FieldLegend
                                          variant='label'
                                          className='text-muted-foreground'
                                        >
                                          {group.label}
                                        </FieldLegend>
                                        <div className='grid grid-cols-4 justify-items-center gap-4 @min-[36rem]:grid-cols-8 @min-[36rem]:gap-3'>
                                          {group.avatars.map(
                                            (avatar, index) => (
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
                                                        groupIndex * 8 +
                                                        index +
                                                        1,
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
                                            ),
                                          )}
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
                            </FieldSet>
                          </AvatarPickerTransition>
                        )}
                      </AnimatePresence>
                    </FieldGroup>
                  );
                }}
              />
            </FieldGroup>

            <FieldSet>
              <FieldLegend className='text-muted-foreground pl-3'>
                {t('profile.profile')}
              </FieldLegend>
              <div className='overflow-hidden rounded-xl'>
                <FieldGroup className='gap-0'>
                  <Controller
                    name='name'
                    disabled={disabled}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor='synclan-profile-name'
                          className='has-data-checked:bg-transparent dark:has-data-checked:bg-transparent'
                        >
                          <Item
                            variant='muted'
                            size='xs'
                            className='hover:bg-muted rounded-none transition-colors'
                          >
                            <ItemContent>
                              <ItemTitle>{t('profile.name')}</ItemTitle>
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </ItemContent>
                            <ItemActions>
                              <Input
                                {...field}
                                value={
                                  isEdit
                                    ? (field.value ?? '')
                                    : (current?.name ?? '')
                                }
                                disabled={
                                  disabled || form.formState.isSubmitting
                                }
                                id='synclan-profile-name'
                                aria-invalid={fieldState.invalid}
                                placeholder='name'
                                autoComplete='username'
                                className='text-muted-foreground border-none bg-transparent! pr-0 text-right outline-none focus-visible:border-none focus-visible:ring-0 disabled:opacity-100'
                              />
                              <ChevronRightIcon className='size-4' />
                            </ItemActions>
                          </Item>
                        </FieldLabel>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </div>
              <FieldDescription className='pl-3'>
                {t('profile.enterNameAndPhoto')}
              </FieldDescription>
            </FieldSet>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

export { ProfilePage as Component, loader };
