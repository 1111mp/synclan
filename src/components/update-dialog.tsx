import { relaunch } from '@tauri-apps/plugin-process';
import debounce from 'lodash-es/debounce';
import { Info } from 'lucide-react';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Field,
  FieldLabel,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  Kbd,
  Progress,
  Spinner,
} from '@/components/ui';
import { useUpdaterStore } from '@/stores';

const notes =
  '### Features\n\n- Add `shim` subcommand to manage executable shims\n- Support Liquid Glass icons on macOS platform\n- Support Polish language\n\n### Features\n\n- Add `shim` subcommand to manage executable shims\n- Support Liquid Glass icons on macOS platform\n- Support Polish language';

function UpdateDialog() {
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [installing, setInstalling] = useState<boolean>(false);
  const [percentage, setPercentage] = useState<number>();

  const { open, update } = useUpdaterStore(
    useShallow((s) => ({
      open: s.open,
      update: s.update,
    })),
  );

  const downloadUpdate = async () => {
    if (update === null) return;

    setDownloading(true);
    setDownloaded(false);

    let downloaded: number = 0;
    let total: number = 0;
    const updateProgress = debounce(
      (downloaded: number, contentLength: number) => {
        if (contentLength > 0) {
          setPercentage(Math.floor((downloaded / contentLength) * 100));
        }
      },
      100,
    );

    try {
      await update.download((progress) => {
        switch (progress.event) {
          case 'Started':
            total = progress.data.contentLength ?? 0;
            break;

          case 'Progress':
            downloaded += progress.data.chunkLength;
            updateProgress(downloaded, total);
            break;

          case 'Finished':
            setPercentage(100);
            break;
        }
      });

      setDownloading(false);
      setDownloaded(true);
    } catch {
      toast.error('Failed to download update', {
        toasterId: 'global',
        description: 'Please check your network connection and try again.',
      });
      setDownloading(false);
    }
  };

  const installUpdate = async () => {
    if (!update) return;

    try {
      setInstalling(true);

      await update.install();
      await relaunch();
    } catch {
      toast.error('Update installation failed. Please try again.', {
        toasterId: 'global',
      });
      setInstalling(false);
    }
  };

  const hasUpdate = update !== null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className='max-w-xl!'>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Info />
          </AlertDialogMedia>
          <AlertDialogTitle>Update Info</AlertDialogTitle>
          <AlertDialogDescription>
            Update to enjoy a better experience with the latest improvements and
            fixes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          {hasUpdate && (
            <>
              <ItemGroup className='grid grid-cols-2 gap-4'>
                <Item>
                  <ItemContent>
                    <ItemTitle>Current Version</ItemTitle>
                    <ItemDescription>v0.0.1</ItemDescription>
                  </ItemContent>
                </Item>
                <Item>
                  <ItemContent>
                    <ItemTitle>New Version</ItemTitle>
                    <ItemDescription>v0.0.2</ItemDescription>
                  </ItemContent>
                </Item>
              </ItemGroup>
              <Item>
                <ItemContent>
                  <ItemTitle>Release Notes</ItemTitle>
                  <div className='bg-muted text-muted-foreground mt-2 max-h-50 overflow-auto rounded-sm p-3'>
                    <Markdown
                      components={{
                        a: ({ children, ...props }) => {
                          return (
                            <a
                              className='text-primary underline'
                              {...props}
                              target='_blank'
                            >
                              {children}
                            </a>
                          );
                        },
                        h3: ({ children }) => (
                          <h3 className='text-base font-bold'>{children}</h3>
                        ),
                        ul: ({ children }) => (
                          <ul className='px-6 py-2'>{children}</ul>
                        ),
                        li: ({ children }) => (
                          <li className='list-disc text-sm leading-6'>
                            {children}
                          </li>
                        ),
                        code: ({ children }) => (
                          <Kbd className='text-card-foreground bg-card'>
                            {children}
                          </Kbd>
                        ),
                      }}
                    >
                      {notes}
                    </Markdown>
                  </div>
                </ItemContent>
              </Item>
            </>
          )}
          {percentage !== undefined && (
            <Field className='w-full px-3 py-2'>
              <FieldLabel htmlFor='progress-upload'>
                <span>Download progress</span>
                <span className='ml-auto'>{percentage}%</span>
              </FieldLabel>
              <Progress value={percentage} id='progress-upload' />
            </Field>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={async () => {
              setDownloading(false);
              setDownloaded(false);
              setPercentage(undefined);

              useUpdaterStore.getState().setOpen(false);
              useUpdaterStore.getState().setUpdate(null);

              if (update) {
                await update.close();
              }
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!hasUpdate || downloading || installing}
            onClick={async () => {
              if (downloaded) {
                await installUpdate();
              } else {
                await downloadUpdate();
              }
            }}
          >
            {(downloading || installing) && <Spinner />}
            {downloaded ? 'Quit and Install' : 'Update'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { UpdateDialog };
