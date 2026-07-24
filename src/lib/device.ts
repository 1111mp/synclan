import { v4 as uuidv4 } from 'uuid';

import { isWeb } from '@/lib/constant';
import { getDeviceById, registerDevice } from '@/services/cmd';

export const DEVICE_ID_STORAGE_KEY = '__SYNCLAN_DEVICE_ID__';

export async function getDevice(): Promise<IDevice> {
  let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  }

  const device = await getDeviceById(deviceId);
  if (device) {
    return device;
  }

  const newDevice: Partial<IDevice> = {
    id: deviceId,
    name: generateDefaultDeviceName(deviceId),
    role: isWeb ? 'client' : 'host',
    platform: getPlatform(),
    browser: getBrowser(),
  };
  const createdDevice = await registerDevice(newDevice);
  return createdDevice;
}

export function generateDefaultDeviceName(deviceId: string): string {
  const platform = getPlatform();
  const browser = getBrowser();
  const suffix = deviceId.slice(0, 4);
  return `${platform}-${browser}-${suffix}`;
}

interface NavigatorUAData {
  readonly brands: ReadonlyArray<{
    brand: string;
    version: string;
  }>;
  readonly mobile: boolean;
  readonly platform: string;
}

interface Navigator {
  readonly userAgentData?: NavigatorUAData;
}

export function getPlatform(): string {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone')) return 'iOS';
  if (ua.includes('ipad')) return 'iPadOS';
  if (ua.includes('macintosh') || ua.includes('mac os x')) return 'macOS';
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('linux')) return 'Linux';

  return (
    (navigator as Navigator).userAgentData?.platform ??
    navigator.platform ??
    'Unknown'
  );
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua) || /AppleWebKit/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Edge/i.test(ua)) return 'Edge';
  return 'Unknown';
}
