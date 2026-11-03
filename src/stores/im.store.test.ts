import { enableMapSet } from 'immer';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: { conversations: { put: vi.fn(), delete: vi.fn() } },
}));
vi.mock('@/lib/i18n', () => ({ i18n: { t: (key: string) => key } }));
vi.mock('@/lib/notification', () => ({ sendNotification: vi.fn() }));
vi.mock('@/services/api', () => ({ setBadgeCount: vi.fn() }));
vi.mock('@/services/cmd', () => ({
  getDeviceById: vi.fn().mockResolvedValue(null),
  getOfflineMsgsSummary: vi.fn(),
  updateMsgAck: vi.fn(),
}));

import { useIMStore } from './im.store';

enableMapSet();
beforeEach(() => {
  useIMStore.setState({
    activeDeviceId: '',
    conversations: new Map(),
    messageCaches: new Map(),
  });
});
const message = (uuid: string): IMessage => ({
  id: 1,
  uuid,
  sender: 'sender',
  receiver: 'receiver',
  type: 'text',
  content: 'hello',
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
});

test('receives a new conversation immediately and deduplicates lost-ACK retries', () => {
  const store = useIMStore.getState();
  store.addMessage('sender', message('retry'), 'receiver');
  store.addMessage('sender', message('retry'), 'receiver');
  const current = useIMStore.getState();
  expect(current.messageCaches.get('sender')?.order).toEqual(['retry']);
  expect(current.conversations.get('sender')?.unreadCount).toBe(1);
});

test('history hydration merges live messages without duplicating them', () => {
  const store = useIMStore.getState();
  store.addMessage('sender', message('live'), 'receiver');
  store.setHistory('sender', [message('history'), message('live')]);
  const cache = useIMStore.getState().messageCaches.get('sender');
  expect(cache?.messages.size).toBe(2);
  expect(new Set(cache?.order).size).toBe(2);
  expect(cache?.hydrated).toBe(true);
});
