import { DownloadIcon, FileTextIcon } from 'lucide-react';
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
import { downloadFile } from '@/lib/media';

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
  const extra = parseMessageExtra<FileMessageExtra>(message.extra);

  return (
    <Attachment>
      <AttachmentMedia>
        <FileTextIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{extra?.name ?? '-'}</AttachmentTitle>
        <AttachmentDescription>
          {getFileDescription(extra)}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          type='button'
          title='Download'
          aria-label='Download'
          size='icon-sm'
          variant='secondary'
          onClick={async () => {
            if (!message.content || !extra?.name) {
              return;
            }

            try {
              await downloadFile(message.content, extra.name);
              toast.success('File downloaded');
            } catch {
              toast.error('Unable to download the file');
            }
          }}
        >
          <DownloadIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}

function getFileDescription(extra?: FileMessageExtra) {
  if (!extra) {
    return 'FILE · ';
  }

  const ext = extra.name.split('.').pop()?.toUpperCase();

  return `${ext ?? 'FILE'} · ${formatFileSize(extra.size)}`;
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
