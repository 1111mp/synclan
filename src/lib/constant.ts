export const isWeb = window.__SYNCLAN_PLATFORM__ !== 'tauri';

const isSecure = window.location.protocol === 'https:';

export const BASE_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:53317/api/v1'
  : window.location.origin; // 生产环境用当前域名

export const WS_URL = import.meta.env.DEV
  ? 'ws://127.0.0.1:53317/socket'
  : `${isSecure ? 'wss' : 'ws'}://${window.location.host}/socket`;
