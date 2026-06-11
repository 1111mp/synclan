import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';

export function DeviceDiscover() {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='w-full' size='xl'>
          Device Discover
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Device Discover</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new project.
          </DialogDescription>
        </DialogHeader>
        {/*<form id='form-create-project' onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name='name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='project-name'>Name</FieldLabel>
                  <Input
                    {...field}
                    id='project-name'
                    placeholder='Project name'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='description'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='project-description'>
                    Description
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id='project-description'
                    aria-invalid={fieldState.invalid}
                    placeholder='Optional description'
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='path'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='project-path'>Path</FieldLabel>
                  <ButtonGroup data-invalid={fieldState.invalid}>
                    <Input
                      disabled
                      id='project-path'
                      value={field.value}
                      aria-invalid={fieldState.invalid}
                      placeholder='Select a folder'
                    />
                    <Button
                      variant='outline'
                      onClick={async (evt) => {
                        evt.preventDefault();
                        const { canceled, filePaths } =
                          await window.electron.ipcService.dialog.showOpenDialog(
                            {
                              title: '',
                              properties: ['openDirectory', 'createDirectory'],
                            },
                          );
                        if (canceled) return;
                        field.onChange?.(filePaths[0]);
                      }}
                    >
                      <SquarePenIcon />
                    </Button>
                  </ButtonGroup>
                  <FieldDescription>
                    Choose where your project will be stored
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <Button type='submit' disabled={loading}>
                {loading && <LoaderCircle size={16} className='animate-spin' />}
                Continue
              </Button>
            </DialogFooter>
          </FieldGroup>*/}
        {/*</form>*/}
      </DialogContent>
    </Dialog>
  );
}
