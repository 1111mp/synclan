import { getClientById } from '@/services/cmd';
import { getFingerprintId } from './fingerprint.util';

const CLIENT_STORAGE_KEY = 'CLIENT_INFO';

export async function getClient() {
  const info = localStorage.getItem(CLIENT_STORAGE_KEY);
  if (info !== null) return JSON.parse(info) as Client;

  const fingerprintId = await getFingerprintId();
  const client = await getClientById(fingerprintId);

  return client;
}
