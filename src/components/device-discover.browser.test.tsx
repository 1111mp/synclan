import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, test, vi } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import { devicesDiscover } from '@/services/cmd';

import { DeviceDiscoverProvider, useDeviceDiscover } from './device-discover';

vi.mock('@/services/cmd', () => ({
  devicesDiscover: vi.fn(),
  getSystemTheme: vi.fn(),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/stores', () => ({
  useDeviceStore: (selector: (state: unknown) => unknown) =>
    selector({ current: { id: 'self' } }),
  useIMStore: (selector: (state: unknown) => unknown) =>
    selector({ addConversations: vi.fn(), setActiveConversation: vi.fn() }),
  useConversationList: () => [],
}));

function OpenDiscover() {
  const { openDiscover } = useDeviceDiscover();
  return <button onClick={openDiscover}>Discover</button>;
}

let view: RenderResult | undefined;
let client: QueryClient | undefined;
afterEach(async () => {
  await view?.unmount();
  client?.clear();
  vi.clearAllMocks();
});

test('keeps the dialog centered when first discovery and later results change', async () => {
  let resolveDiscovery!: (devices: IDevice[]) => void;
  vi.mocked(devicesDiscover).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveDiscovery = resolve;
      }),
  );
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  view = await render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DeviceDiscoverProvider>
          <OpenDiscover />
        </DeviceDiscoverProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await view.getByRole('button', { name: 'Discover', exact: true }).click();
  await vi.waitFor(() =>
    expect(document.querySelector('[role="dialog"]')).not.toBeNull(),
  );
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
  // Layout dimensions exclude the intentional opening scale animation.
  const height = dialog.offsetHeight;
  const width = dialog.offsetWidth;
  const top = dialog.offsetTop - height / 2;
  resolveDiscovery(
    Array.from(
      { length: 8 },
      (_, i) =>
        ({
          id: `nearby-${i}`,
          name: `Device ${i}`,
          platform: 'macOS',
          role: 'host',
        }) as IDevice,
    ),
  );
  await vi.waitFor(() =>
    expect(dialog.querySelectorAll('[role="listitem"]')).toHaveLength(8),
  );
  expect(dialog.offsetHeight).toBe(height);
  expect(dialog.offsetWidth).toBe(width);
  expect(dialog.offsetTop - dialog.offsetHeight / 2).toBe(top);
  const list = dialog.querySelector<HTMLElement>('.overflow-y-auto')!;
  expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);

  client.setQueryData(['devices_discover', ['self']], []);
  await vi.waitFor(() =>
    expect(dialog.querySelectorAll('[role="listitem"]')).toHaveLength(0),
  );
  expect(dialog.offsetHeight).toBe(height);
  expect(dialog.offsetTop - dialog.offsetHeight / 2).toBe(top);
});
