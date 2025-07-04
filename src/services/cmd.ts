import { invoke } from '@tauri-apps/api/core';

/**
 * @description Get the local IP address of the device.
 * @return {Promise<string>} IP address.
 */
export async function getLocalIp() {
  return invoke<string>('get_local_ip');
}
