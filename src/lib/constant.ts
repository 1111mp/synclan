export const isWeb = window.__SYNCLAN_PLATFORM__ !== 'tauri';

const isSecure = window.location.protocol === 'https:';

const API_PATH = '/api/v1';
const SOCKET_PATH = '/socket';
const ATTACHMENT_PATH = '/attachments';

function getServerUrl(forceProtocol?: string): URL {
  const url = new URL(window.__SYNCLAN_SERVER_DOMAIN__);

  if (forceProtocol) {
    url.protocol = forceProtocol;
  }

  return url;
}

/**
 * macOS WebView does not trust self-signed certificates by default.
 * Use HTTP unless the certificate has been manually trusted.
 */
function getNativeServerUrl(): URL {
  if (OS_PLATFORM === 'darwin') {
    return getServerUrl('http:');
  }

  return getServerUrl();
}

export function getBaseUrl(): string {
  if (import.meta.env.DEV) {
    return `http://127.0.0.1:53317${API_PATH}`;
  }

  if (isWeb) {
    return `${window.location.origin}${API_PATH}`;
  }

  return `${getNativeServerUrl().origin}${API_PATH}`;
}

export function getWSUrl(): string {
  if (import.meta.env.DEV) {
    return 'ws://127.0.0.1:53317/socket';
  }

  if (isWeb) {
    return `${isSecure ? 'wss' : 'ws'}://${window.location.host}${SOCKET_PATH}`;
  }

  const url = getNativeServerUrl();

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${url.origin}${SOCKET_PATH}`;
}

export function getAttachmentBaseUrl(): string {
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:53317/attachments';
  }

  if (isWeb) {
    return `${window.location.origin}${ATTACHMENT_PATH}`;
  }

  return `${getNativeServerUrl().origin}${ATTACHMENT_PATH}`;
}
