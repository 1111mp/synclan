import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, ChevronRightIcon, User } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
} from '@/components/ui';
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

function ProfilePage() {
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const current = useDeviceStore((s) => s.current);
  const updateCurrent = useDeviceStore((s) => s.updateCurrent);

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
        error instanceof Error ? error.message : 'Failed to upload profile',
      );
    }
  };

  const disabled = !isEdit;

  return (
    <div className='h-dvh w-full overflow-y-auto'>
      <header
        data-tauri-drag-region={OS_PLATFORM !== 'win32'}
        className='bg-background/80 sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-end gap-2 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
      >
        <Button variant='outline' onClick={onEdit}>
          {isEdit ? 'Done' : 'Edit'}
        </Button>
      </header>
      <div
        className={cn(
          'mx-auto max-w-2xl px-4',
          OS_PLATFORM === 'darwin' && 'min-h-full',
        )}
      >
        <form id='form-synclan-profile' aria-disabled={disabled}>
          <FieldGroup className='pb-6'>
            <FieldGroup className='items-center'>
              <Controller
                name='avatar'
                disabled={disabled}
                control={form.control}
                render={({ field }) => {
                  const avatarUrl = resolveResourceUrl(field.value);
                  return (
                    <Avatar
                      className='relative size-32 overflow-hidden'
                      onClick={() => {
                        openPreview([avatarUrl], 0);
                      }}
                    >
                      <AvatarImage
                        className='rounded-full'
                        src={avatarUrl}
                        alt='shadcn'
                      />
                      <AvatarFallback className='rounded-full'>
                        <User />
                      </AvatarFallback>
                      {!disabled && (
                        <span
                          className='group bg-primary-foreground/50 absolute z-10 flex size-full items-center justify-center'
                          onClick={async (evt) => {
                            evt.stopPropagation();
                            try {
                              const url = await onPickImage();
                              if (url) {
                                field.onChange(url);
                              }
                            } catch (error) {
                              toast.error(
                                error.message ?? 'Failed to upload avatar',
                              );
                            }
                          }}
                        >
                          <Camera
                            className='size-8 transition-colors duration-300 group-hover:text-blue-400'
                            strokeWidth={1}
                          />
                        </span>
                      )}
                    </Avatar>
                  );
                }}
              />
            </FieldGroup>

            <FieldSet>
              <FieldLegend className='text-muted-foreground pl-3'>
                Profile
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
                              <ItemTitle>Name</ItemTitle>
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </ItemContent>
                            <ItemActions>
                              <Input
                                {...field}
                                id='synclan-profile-name'
                                // aria-invalid={fieldState.invalid}
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
                Enter your name and add a profile photo.
              </FieldDescription>
            </FieldSet>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

export { ProfilePage as Component, loader };
