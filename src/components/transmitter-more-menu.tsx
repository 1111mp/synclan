import { CirclePlus, File, Image } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';

// const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ACCEPT_MEDIA_TYPES = ['image/', 'video/'];

type Props = {
  onSelectMedia?: (files: File[]) => Promise<void>;
  onSelectFile?: (files: File[]) => Promise<void>;
};

function TransmitterMoreMenu({ onSelectMedia, onSelectFile }: Props) {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();

  const handleMediaChange = async (
    evt: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(evt.target.files ?? []);

    evt.target.value = '';

    if (!files.length) {
      return;
    }

    const validFiles = files.filter((file) => {
      const isMedia = ACCEPT_MEDIA_TYPES.some((type) =>
        file.type.startsWith(type),
      );

      if (!isMedia) {
        console.warn(
          `${t('transmitterMoreMenu.unsupportedFile')} ${file.name}`,
        );
        return false;
      }

      // if (file.size > MAX_FILE_SIZE) {
      //   console.warn(`File too large: ${file.name}`);
      //   return false;
      // }

      return true;
    });

    if (!validFiles.length) {
      return;
    }

    await onSelectMedia?.(validFiles);
  };

  const handleFileChange = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(evt.target.files ?? []);

    evt.target.value = '';

    if (!files.length) {
      return;
    }

    const validFiles = files.filter((_file) => {
      // if (file.size > MAX_FILE_SIZE) {
      //   console.warn(`File too large: ${file.name}`);
      //   return false;
      // }

      return true;
    });

    if (!validFiles.length) {
      return;
    }

    await onSelectFile?.(validFiles);
  };

  return (
    <>
      <input
        ref={mediaInputRef}
        type='file'
        accept='image/*,video/*'
        multiple
        hidden
        onChange={handleMediaChange}
      />
      <input
        ref={fileInputRef}
        type='file'
        multiple
        hidden
        onChange={handleFileChange}
      />

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <Tooltip delayDuration={300}>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                size='sm'
                variant='ghost'
                className='text-muted-foreground hover:text-muted-foreground px-1.5'
              >
                <CirclePlus className='size-6' />
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <TooltipContent>{t('transmitterMoreMenu.more')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          className='w-36'
          onCloseAutoFocus={(evt) => evt.preventDefault()}
        >
          <DropdownMenuItem
            onSelect={() => {
              mediaInputRef.current?.click();
            }}
          >
            <Image />
            {t('transmitterMoreMenu.photoOrVideo')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              fileInputRef.current?.click();
            }}
          >
            <File />
            {t('transmitterMoreMenu.file')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export { TransmitterMoreMenu, type Props as TransmitterMoreMenuProps };
