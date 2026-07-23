import { v4 as uuidv4 } from 'uuid';

import { api } from '@/lib/api';

const CHUNK_THRESHOLD = 100 * 1024 * 1024; // 100MB
const DEFAULT_CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_RETRY = 3;

interface UploadInitResponse {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
}

interface UploadCompleteResponse {
  path: string;
}

export interface UploadFileOptions {
  permanent?: boolean;
  signal?: AbortSignal;
  concurrency?: number;
  chunkSize?: number;
  retry?: number;
  onProgress?: (progress: number) => void;
}

export async function uploadFile(
  file: File,
  options: UploadFileOptions = {},
): Promise<string> {
  const {
    permanent = false,
    signal,
    concurrency = DEFAULT_CONCURRENCY,
    chunkSize = DEFAULT_CHUNK_SIZE,
    retry = DEFAULT_RETRY,
    onProgress,
  } = options;

  if (file.size <= CHUNK_THRESHOLD) {
    return uploadSimple(file, permanent, signal);
  }

  return uploadChunk(file, {
    signal,
    concurrency,
    chunkSize,
    retry,
    onProgress,
  });
}

async function uploadSimple(
  file: File,
  permanent: boolean,
  signal?: AbortSignal,
) {
  const formData = new FormData();
  formData.append('name', `${uuidv4()}__${file.name}`);
  formData.append('file', file);
  if (permanent) {
    formData.append('permanent', 'true');
  }

  const resp = await api.upload<string>('/upload', formData, { signal });

  if (!resp.payload) {
    throw new Error('Failed to upload file');
  }

  return resp.payload;
}

async function uploadChunk(
  file: File,
  options: Omit<UploadFileOptions, 'permanent'> &
    Required<{
      concurrency: number;
      chunkSize: number;
      retry: number;
    }>,
): Promise<string> {
  const { signal, concurrency, chunkSize, retry, onProgress } = options;

  const init = await api.post<UploadInitResponse>(
    '/upload/chunk/init',
    {
      name: `${uuidv4()}__${file.name}`,
      // name: file.name,
      size: file.size,
      chunkSize,
    },
    { signal },
  );

  if (!init.payload) {
    throw new Error('Init upload failed');
  }

  const { uploadId, chunkSize: serverChunkSize, totalChunks } = init.payload;

  let uploadedBytes = 0;

  await parallel(totalChunks, concurrency, async (index) => {
    signal?.throwIfAborted?.();

    const start = index * serverChunkSize;
    const end = Math.min(start + serverChunkSize, file.size);

    const blob = file.slice(start, end);

    const form = new FormData();

    form.append('uploadId', uploadId);
    form.append('index', String(index));
    form.append('file', blob, `${index}.chunk`);

    await retryRequest(
      () =>
        api.upload('/upload/chunk', form, {
          signal,
        }),
      retry,
    );

    uploadedBytes += blob.size;

    onProgress?.(Math.min(uploadedBytes / file.size, 1));
  });

  const complete = await api.post<UploadCompleteResponse>(
    '/upload/chunk/complete',
    {
      uploadId,
    },
    {
      signal,
    },
  );

  const path = complete.payload?.path;

  if (!path) {
    throw new Error('Complete upload failed');
  }

  onProgress?.(1);

  return path;
}

async function parallel(
  total: number,
  concurrency: number,
  worker: (index: number) => Promise<void>,
) {
  let cursor = 0;

  async function next() {
    while (true) {
      const index = cursor++;

      if (index >= total) {
        return;
      }

      await worker(index);
    }
  }

  await Promise.all(
    Array.from(
      {
        length: Math.min(concurrency, total),
      },
      () => next(),
    ),
  );
}

async function retryRequest<T>(
  fn: () => Promise<T>,
  retry: number,
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < retry; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (i < retry - 1) {
        await sleep(500 * (i + 1));
      }
    }
  }

  throw lastError;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
