import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { dataUriToBuffer } from 'data-uri-to-buffer';
import { v4 as uuidv4 } from 'uuid';

import { api } from '@/lib/api';
import { isWeb } from '@/lib/constant';
import { db } from '@/lib/db';

const SYNCLAN_CONFIG_TORAGE_KEY = '__SYNCLAN_CONFIG__';

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
 * Get synclan configuration.
 */
export async function getSynclanConfig() {
  if (isWeb) {
    // TODO fetch from server
    const configStr = localStorage.getItem(SYNCLAN_CONFIG_TORAGE_KEY);
    if (!configStr) {
      return {
        theme: 'system',
        locale: getDefaultLocale(),
      } as ISynclanConfig;
    }
    try {
      return JSON.parse(configStr) as ISynclanConfig;
    } catch {
      return {
        theme: 'system',
        locale: getDefaultLocale(),
      } as ISynclanConfig;
    }
  }
  return invoke<ISynclanConfig>('get_synclan_config');
}

function getDefaultLocale(): AppLocale {
  const locale = navigator.language.toLowerCase();

  if (locale.startsWith('zh')) {
    return 'zh-CN';
  }

  return 'en';
}

/**
 * Patch synclan configuration
 */
export async function patchSynclanConfig(payload: Partial<ISynclanConfig>) {
  if (isWeb) {
    localStorage.setItem(SYNCLAN_CONFIG_TORAGE_KEY, JSON.stringify(payload));
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
  try {
    return invoke<IDevice | null>('get_device_by_id', { id });
  } catch {
    return null;
  }
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

export async function getOfflineMessages(
  receiver: string,
): Promise<IMessage[]> {
  if (isWeb) {
    try {
      const response = await api.get<IMessage[]>('/messages/offline');
      return response.payload ?? [];
    } catch {
      return [];
    }
  }
  return invoke<IMessage[]>('get_offline_messages', { receiver });
}

export async function getOfflineMsgsSummary(
  receiver: string,
): Promise<OfflineMessagesSummary | null> {
  if (isWeb) {
    try {
      const response = await api.get<OfflineMessagesSummary>(
        '/messages/offline_summary',
      );
      return response.payload ?? null;
    } catch {
      return null;
    }
  }
  return invoke<OfflineMessagesSummary>('get_offline_msgs_summary', {
    receiver,
  });
}

export async function updateMsgAck(payload: MessageAck) {
  if (isWeb) {
    await api.post<void>('/messages/ack', payload);
    return;
  }
  return invoke<void>('update_ack', { payload });
}

export interface DevicePatch {
  name?: string;
  avatar?: string;
}

export async function updateDeviceProfile(id: string, patch: DevicePatch) {
  const response = await api.patch<IDevice>(`/devices/${id}`, patch);
  return response.payload;
}

export async function deleteConversationMessages(
  selfId: string,
  targetId: string,
) {
  if (isWeb) {
    const response = await api.delete<null>(
      `/messages/conversation/${targetId}`,
    );
    return response?.payload;
  }

  return invoke<void>('delete_conversation_messages', { selfId, targetId });
}

export async function deleteMessage(deviceId: string, uuid: string) {
  if (isWeb) {
    const response = await api.delete<boolean>(`/messages/${uuid}`);
    return response?.payload;
  }

  return invoke<void>('delete_message_by_uuid', { deviceId, uuid });
}

export async function uploadAttachment(attachment: Attachment) {
  const parsed = dataUriToBuffer(attachment.src);
  const blob = new Blob([parsed.buffer], { type: parsed.type });
  const filename = `${uuidv4()}__${attachment.name}`;
  const formData = new FormData();
  formData.append('name', filename);
  formData.append('file', blob);

  const resp = await api.upload<string>('/upload', formData);
  const payload = resp.payload ?? null;
  if (payload === null) {
    throw new Error('Failed to upload attachment');
  }
  return payload;
}

export async function uploadFile(file: File, permanent: boolean = false) {
  const formData = new FormData();
  formData.append('name', `${uuidv4()}__${file.name}`);
  formData.append('file', file);
  if (permanent) {
    formData.append('permanent', 'true');
  }

  const resp = await api.upload<string>('/upload', formData);
  const payload = resp.payload ?? null;
  if (payload === null) {
    throw new Error('Failed to upload file');
  }
  return payload;
}

export async function onPickImage(): Promise<string | null> {
  if (isWeb) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async () => {
        const file = input.files?.[0];

        if (!file) {
          resolve(null);
          return;
        }

        try {
          const url = await uploadFile(file, true);
          resolve(url);
        } catch (error) {
          reject(error);
        } finally {
          input.remove();
        }
      };

      input.oncancel = () => {
        input.remove();
        resolve(null);
      };

      input.click();
    });
  }

  const path = await openDialog({
    multiple: false,
    directory: false,
    pickerMode: 'image',
    filters: [
      {
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'webp'],
      },
    ],
  });

  if (!path || typeof path !== 'string') {
    return null;
  }

  const bytes = await readFile(path);
  const blob = new Blob([bytes]);

  const fileName = path.split(/[/\\]/).pop() || 'avatar.png';
  const fileExtension = fileName.split('.').pop() || 'png';

  const file = new File([blob], fileName, { type: `image/${fileExtension}` });

  const url = await uploadFile(file, true);
  return url;
}
