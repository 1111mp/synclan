import { getBaseUrl } from '@/lib/constant';
import { DEVICE_ID_STORAGE_KEY } from '@/lib/device';

export interface RequestOptions extends RequestInit {
  params?: Record<
    string,
    string | number | boolean | string[] | number[] | undefined
  >;
}

interface ApiErrorPayload {
  message?: string;
  statusCode?: number;
  [key: string]: any;
}

export class HttpError extends Error {
  public statusCode: number;

  constructor(
    public status: number,
    public data: unknown,
  ) {
    const apiMessage = (data as ApiErrorPayload)?.message;
    super(apiMessage ?? `HTTP Error: ${status}`);
    this.statusCode = (data as ApiErrorPayload)?.statusCode ?? status;
  }
}

function buildUrl(path: string, params?: RequestOptions['params']) {
  const url = new URL(path, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== undefined && item !== null) {
              url.searchParams.append(key, String(item));
            }
          });
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });
  }

  return url.pathname + url.search;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = localStorage.getItem(DEVICE_ID_STORAGE_KEY);

  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(getBaseUrl() + buildUrl(path, options.params), {
    ...options,
    headers,
  });

  let data: unknown = null;

  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new HttpError(response.status, data);
  }

  return data as T;
}

type ApiResponse<T> = {
  message?: string;
  payload: T;
  statusCode: number;
};

export const api = {
  get<T>(path: string, params?: RequestOptions['params']) {
    return request<ApiResponse<T>>(path, {
      method: 'GET',
      params,
    });
  },

  post<T>(path: string, body?: unknown) {
    return request<ApiResponse<T>>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  upload<T>(path: string, formData: FormData) {
    return request<ApiResponse<T>>(path, {
      method: 'POST',
      body: formData,
    });
  },

  patch<T>(path: string, body?: unknown) {
    return request<ApiResponse<T>>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown) {
    return request<ApiResponse<T>>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string) {
    return request<ApiResponse<T>>(path, {
      method: 'DELETE',
    });
  },
};
