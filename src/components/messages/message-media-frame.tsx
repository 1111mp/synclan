import {
  ImageOffIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  VideoOffIcon,
} from 'lucide-react';
import { type PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import type { MediaLoadStatus } from './use-media-load-state';

type Props = PropsWithChildren<{
  width: number;
  height: number;
  status: MediaLoadStatus;
  mediaType: 'image' | 'video';
  name?: string;
  onRetry: () => void;
}>;

export function MessageMediaFrame({
  width,
  height,
  status,
  onRetry,
  mediaType,
  name,
  children,
}: Props) {
  const { t } = useTranslation();
  return (
    <div
      className='bg-muted text-foreground ring-border relative overflow-hidden rounded-xl ring-1 ring-inset'
      style={{ width, maxWidth: '100%', aspectRatio: `${width} / ${height}` }}
      aria-busy={status === 'loading' || status === 'retrying'}
    >
      {children}
      {status === 'loading' && (
        <Skeleton className='pointer-events-none absolute inset-0 size-full rounded-none motion-reduce:animate-none' />
      )}
      {(status === 'error' || status === 'retrying') && (
        <div
          role='status'
          className='bg-muted text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-xs'
        >
          {mediaType === 'video' ? (
            <VideoOffIcon className='size-5' aria-hidden />
          ) : (
            <ImageOffIcon className='size-5' aria-hidden />
          )}
          <span className='text-foreground font-medium'>
            {t(
              mediaType === 'image'
                ? 'message.imageFailed'
                : 'message.videoFailed',
            )}
          </span>
          {name && (
            <span className='max-w-full truncate' title={name}>
              {name}
            </span>
          )}
          <span className='max-w-64 leading-relaxed text-pretty'>
            {t('message.mediaRecoveryHint')}
          </span>
          <Button
            variant='secondary'
            size='sm'
            className='min-w-24'
            disabled={status === 'retrying'}
            onClick={onRetry}
          >
            {status === 'retrying' ? (
              <LoaderCircleIcon
                data-icon='inline-start'
                className='animate-spin motion-reduce:animate-none'
              />
            ) : (
              <RotateCcwIcon data-icon='inline-start' />
            )}
            {t(status === 'retrying' ? 'message.retrying' : 'message.retry')}
          </Button>
        </div>
      )}
    </div>
  );
}
