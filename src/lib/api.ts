import { DEVICE_ID_STORAGE_KEY } from './device';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message?: string,
  ) {
    super(message ?? `HTTP Error: ${status}`);
  }
}

const BASE_URL = import.meta.env.DEV
  ? 'http://192.168.8.248:53317/api/v1'
  : window.location.origin; // 生产环境用当前域名

function buildUrl(path: string, params?: RequestOptions['params']) {
  const url = new URL(path, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
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

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(BASE_URL + buildUrl(path, options.params), {
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

  put<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string) {
    return request<T>(path, {
      method: 'DELETE',
    });
  },
};
