import { DownloadIcon, FileTextIcon, LoaderCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui';
import { downloadFile, getMediaUrl } from '@/lib/media';

import { parseMessageExtra } from './util';

type FileMessageExtra = {
  name: string;
  size: number;
  mimeType: string;
};

type Props = {
  message: FileMessage;
};

function FileMessage({ message }: Props) {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);
  const extra = parseMessageExtra<FileMessageExtra>(message.extra);

  return (
    <Attachment className='w-72' aria-busy={downloading}>
      <AttachmentMedia>
        <FileTextIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle title={extra?.name}>
          {extra?.name || t('message.file')}
        </AttachmentTitle>
        <AttachmentDescription>
          {getFileDescription(extra, t('message.file'))}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          type='button'
          title={t(downloading ? 'message.downloading' : 'message.download')}
          aria-label={t(
            downloading ? 'message.downloading' : 'message.download',
          )}
          disabled={downloading || !message.content || !extra?.name}
          size='icon-sm'
          variant='secondary'
          onClick={async () => {
            if (!message.content || !extra?.name) {
              return;
            }

            setDownloading(true);
            try {
              const url = getMediaUrl(message.content);

              const saved = await downloadFile(url, extra.name);
              if (saved) toast.success(t('message.downloaded'));
            } catch {
              toast.error(t('message.downloadFailed'));
            } finally {
              setDownloading(false);
            }
          }}
        >
          {downloading ? (
            <LoaderCircleIcon className='animate-spin motion-reduce:animate-none' />
          ) : (
            <DownloadIcon />
          )}
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}

function getFileDescription(
  extra: FileMessageExtra | undefined,
  fallback: string,
) {
  if (!extra?.name) {
    return fallback;
  }

  const ext = extra.name.includes('.')
    ? extra.name.split('.').pop()?.toUpperCase()
    : undefined;

  return `${ext || fallback} · ${formatFileSize(extra.size)}`;
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export { FileMessage };
