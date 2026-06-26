import { invoke } from '@tauri-apps/api/core';

import { api } from '@/lib/api';
import { isWeb } from '@/lib/constant';
import { db } from '@/lib/db';

/**
 * @description Get the local IP address of the device.
 * @returns {Promise<string>} IP address.
 */
export async function getLocalIp() {
  return invoke<string>('get_local_ip');
}

export async function getServerDomain() {
  if (isWeb) {
    return window.location.origin;
  }
  return invoke<string>('get_server_domain');
}

/**
 * @description Get synclan configuration.
 * @returns {Promise<ISynclanConfig>} configuration data.
 */
export async function getSynclanConfig() {
  if (isWeb) {
    // TODO fetch from server
    return {
      theme: 'system',
    } as ISynclanConfig;
  }
  return invoke<ISynclanConfig>('get_synclan_config');
}

/**
 * @description Patch synclan configuration
 * @param {ISynclanConfig} synclan configuration data
 * @returns {Promise<void>}
 */
export async function patchSynclanConfig(payload: ISynclanConfig) {
  if (isWeb) {
    // TODO
    return;
  }
  return invoke<void>('patch_synclan_config', { payload });
}

export async function getDeviceById(id: string): Promise<IDevice | null> {
  if (isWeb) {
    try {
      const device = await api.get<IDevice>(`/devices/${id}`);
      return device.payload;
    } catch {
      return null;
    }
  }
  return invoke<IDevice | null>('get_device_by_id', { id });
}

export async function getDevices(selfId?: string): Promise<IDevice[]> {
  if (isWeb) {
    try {
      const devices = await api.get<IDevice[]>('/devices');
      return devices.payload ?? [];
    } catch {
      return [];
    }
  }
  return invoke<IDevice[]>('get_devices', { selfId });
}

export async function devicesDiscover(excludeIds: string[] = []) {
  if (isWeb) {
    try {
      const devives = await api.get<IDevice[]>('/devices/discover', {
        ids: excludeIds,
      });
      return devives.payload ?? [];
    } catch {
      return [];
    }
  }
  return invoke<IDevice[]>('devices_discover', { excludeIds });
}

export async function getDevicesFromLocal() {
  try {
    const conversations = await db.conversations
      .orderBy('lastAccessed')
      .reverse()
      .toArray();
    return conversations;
  } catch {
    return [];
  }
}

export async function registerDevice(
  device: Partial<IDevice>,
): Promise<IDevice> {
  if (isWeb) {
    // TODO
    const data = await api.post<IDevice>('/devices', device);
    return data.payload;
  }
  return invoke<IDevice>('register_device', { payload: device });
}

export async function getSystemTheme() {
  if (isWeb) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    return media.matches ? 'dark' : 'light';
  }
  return invoke<AppBaseTheme>('get_system_theme');
}

export type FetchMessagesParams = {
  selfId: string;
  targetId: string;
  lastId?: number;
  pageSize?: number;
};
export type FetchMessagesResp = {
  data: IMessage[];
  nextCursor?: number | null;
};

export async function getMessages({
  selfId,
  targetId,
  lastId,
  pageSize = 20,
}: FetchMessagesParams): Promise<FetchMessagesResp> {
  if (isWeb) {
    try {
      const response = await api.get<CursorPaginatedMessages>('/messages', {
        selfId,
        targetId,
        lastId,
        pageSize,
      });
      const { messages, hasMore, lastId: serverLastId } = response.payload;
      const formattedMessages = [...messages].reverse();
      return {
        data: formattedMessages,
        // 将后端的 last_id（更旧数据的游标）作为向前的参数返回
        nextCursor: hasMore ? serverLastId : undefined,
      };
    } catch {
      return {
        data: [],
      };
    }
  }
  const data = await invoke<CursorPaginatedMessages>('get_messages', {
    selfId,
    targetId,
    lastId,
    pageSize,
  });
  return {
    data: [...data.messages].reverse(),
    // 将后端的 last_id（更旧数据的游标）作为向前的参数返回
    nextCursor: data.hasMore ? data.lastId : undefined,
  };
}
