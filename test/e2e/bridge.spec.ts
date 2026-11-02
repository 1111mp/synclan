import { browser, expect } from '@wdio/globals';

describe('Desktop test bridge', () => {
  it('serves the browser client from the real Rust HTTP server', async () => {
    const domain = await browser.tauri.execute(
      ({ core }) => core.invoke('get_server_domain') as Promise<string>,
    );
    expect(new URL(domain).hostname).toBe('127.0.0.1');
    let lastResponse = 'No response';
    await browser
      .waitUntil(
        async () => {
          try {
            const response = await fetch(`${domain}/welcome`);
            const body = await response.text();
            lastResponse = `${response.status}: ${body.slice(0, 200)}`;
            return response.ok && body.includes('id="root"');
          } catch (error) {
            lastResponse = String(error);
            return false;
          }
        },
        { timeoutMsg: 'The Rust server did not serve the browser client' },
      )
      .catch((error) => {
        throw new Error(`${String(error)} (${domain}: ${lastResponse})`);
      });
  });

  it('mocks an IPC command through the service and restores it', async () => {
    const mock = await browser.tauri.mock('e2e_bridge_probe');
    try {
      await mock.mockReturnValue({ status: 'ready' });
      const result = await browser.tauri.execute(({ core }) =>
        core.invoke('e2e_bridge_probe', { id: 'probe-1' }),
      );
      expect(result).toEqual({ status: 'ready' });
    } finally {
      await mock.mockRestore();
    }
    // This command has no Rust handler; rejection proves the mock was removed.
    await expect(
      browser.tauri.execute(({ core }) => core.invoke('e2e_bridge_probe')),
    ).rejects.toBeDefined();
  });

  it('persists autostart settings without accessing OS startup registration', async () => {
    try {
      await browser.tauri.execute(({ core }) =>
        core.invoke('patch_synclan_config', {
          payload: { enable_auto_launch: true },
        }),
      );
      const config = await browser.tauri.execute(
        ({ core }) =>
          core.invoke('get_synclan_config') as Promise<{
            enable_auto_launch: boolean;
          }>,
      );
      expect(config.enable_auto_launch).toBe(true);
    } finally {
      await browser.tauri.execute(({ core }) =>
        core.invoke('patch_synclan_config', {
          payload: { enable_auto_launch: false },
        }),
      );
    }
  });

  it('captures a PNG screenshot from the native webview', async () => {
    const screenshot = await browser.takeScreenshot();
    expect(Buffer.from(screenshot, 'base64').subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  });
});
