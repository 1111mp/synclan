import {
  isPermissionGranted,
  requestPermission,
  sendNotification as tauriSendNotification,
  type Options,
} from '@tauri-apps/plugin-notification';

import { isWeb } from '@/lib/constant';

async function checkPremission() {
  if (isWeb) return false;

  let permissionGranted = await isPermissionGranted();

  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }

  return permissionGranted;
}

export async function sendNotification(options: Options | string) {
  if (isWeb) {
    await sendWebNotification(options);
    return;
  }

  await sendTauriNotification(options);
}

async function sendWebNotification(options: Options | string) {
  if (!('Notification' in window)) {
    return;
  }

  let permission = Notification.permission;

  if (permission !== 'granted') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return;
  }

  const notification =
    typeof options === 'string'
      ? {
          body: truncateNotificationText(options),
        }
      : {
          title: options.title,
          body: options.body
            ? truncateNotificationText(options.body)
            : undefined,
          icon: options.icon,
        };

  new Notification(notification.title ?? '', notification);
}

async function sendTauriNotification(options: Options | string) {
  const permissionGranted = await checkPremission();
  if (!permissionGranted) return;

  const notification =
    typeof options === 'string'
      ? truncateNotificationText(options)
      : {
          ...options,
          body: options.body
            ? truncateNotificationText(options.body)
            : undefined,
        };

  tauriSendNotification(notification);
}

function truncateNotificationText(text: string, maxLength = 80) {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}
