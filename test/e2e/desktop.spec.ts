import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { browser, expect } from '@wdio/globals';

type Device = { id: string; name: string; role: string };
const profileName = 'SyncLan E2E User';
const expectedPath = join(
  process.env.SYNCLAN_E2E_DATA_DIR!,
  'expected-device.json',
);
const restoring = process.env.SYNCLAN_E2E_RESTORE === '1';
const userMenu = () =>
  browser.$('[data-sidebar="footer"] button[data-sidebar="menu-button"]');

async function hostDevice() {
  const devices = await browser.tauri.execute(
    ({ core }) => core.invoke('get_devices') as Promise<Device[]>,
  );
  return devices.find((device) => device.role === 'host');
}

async function expectThemePersisted() {
  await browser.waitUntil(
    async () => {
      const config = await browser.tauri.execute(
        ({ core }) =>
          core.invoke('get_synclan_config') as Promise<{ theme: string }>,
      );
      return config.theme === 'dark';
    },
    { timeoutMsg: 'The theme was not saved by the Rust backend' },
  );
  await expect(browser.$('html')).toHaveElementClass('dark');
}

async function openProfile() {
  await userMenu().click();
  // Open Radix's menu through its keyboard interaction in the embedded WebDriver.
  await browser.keys('ArrowDown');
  await expect(userMenu()).toHaveAttribute('aria-expanded', 'true');
  await browser.$('[role="menuitem"]=Profile').click();
  await expect(browser.$('#synclan-profile-name')).toBeDisplayed();
}

describe('Desktop profile and settings persistence', () => {
  before(async () => {
    await browser.waitUntil(
      async () => {
        try {
          return Boolean(await hostDevice());
        } catch {
          return false;
        }
      },
      { timeoutMsg: 'The desktop host device was not registered in SQLite' },
    );
    await expect(userMenu()).toBeDisplayed();
  });

  it('saves profile and theme through the UI and restores them after reload and restart', async () => {
    if (restoring) {
      const expected = JSON.parse(
        await readFile(expectedPath, 'utf8'),
      ) as Device;
      expect(await hostDevice()).toMatchObject(expected);
      await expectThemePersisted();
      await openProfile();
      await expect(browser.$('#synclan-profile-name')).toHaveValue(profileName);
      return;
    }

    await browser.$('button[aria-label="Dark"]').click();
    await expectThemePersisted();
    await openProfile();
    await browser.$('button=Edit').click();
    await browser.$('#synclan-profile-name').setValue(profileName);
    await browser.$('button=Done').click();
    await browser.waitUntil(
      async () => (await hostDevice())?.name === profileName,
      { timeoutMsg: 'The edited profile was not saved to SQLite' },
    );
    await expect(browser.$('#synclan-profile-name')).toBeDisabled();
    const device = (await hostDevice())!;
    await writeFile(
      expectedPath,
      JSON.stringify({ id: device.id, name: profileName, role: 'host' }),
    );

    await browser.refresh();
    await expect(userMenu()).toHaveAttribute('aria-label', profileName);
    await expectThemePersisted();
    await openProfile();
    await expect(browser.$('#synclan-profile-name')).toHaveValue(profileName);
  });
});
