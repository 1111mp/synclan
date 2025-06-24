import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Get the browser fingerprint id
export async function getFingerprintId() {
  const fp = await FingerprintJS.load();
  const { visitorId } = await fp.get();
  return visitorId;
}
