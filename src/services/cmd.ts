import { invoke } from '@tauri-apps/api/core';

/**
 * @description Get the local IP address of the device.
 * @returns {Promise<string>} IP address.
 */
export async function getLocalIp() {
  return invoke<string>('get_local_ip');
}

/**
 * @description Get synclan configuration.
 * @returns {Promise<ISynclanConfig>} configuration data.
 */
export async function getSynclanConfig() {
  return invoke<ISynclanConfig>('get_synclan_config');
}

/**
 * @description Patch synclan configuration
 * @param {ISynclanConfig} synclan configuration data
 * @returns {Promise<void>}
 */
export async function patchSynclanConfig(payload: ISynclanConfig) {
  return invoke<void>('patch_synclan_config', { payload });
}
