import assert from 'node:assert/strict';

import { io } from 'socket.io-client';

const [url, phase] = process.argv.slice(2);
const sockets = [];
const received = new Map();
async function connect(deviceId) {
  const socket = io(`${url}/socket`, {
    transports: ['websocket'],
    auth: { deviceId },
    reconnection: false,
  });
  sockets.push(socket);
  socket.on('synclan://message', (message, ack) => {
    received.set(message.uuid, (received.get(message.uuid) ?? 0) + 1);
    // Simulate a received message whose first ACK is lost on the network.
    if (message.uuid === `retry-${phase}` && received.get(message.uuid) === 1)
      return;
    ack({ statusCode: 200 });
  });
  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  return socket;
}
async function waitFor(predicate) {
  const deadline = Date.now() + 10000;
  while (!predicate()) {
    assert.ok(
      Date.now() < deadline,
      `Timed out; received=${JSON.stringify([...received])}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
async function send(socket, receiver, uuid) {
  const result = await socket.timeout(10000).emitWithAck('synclan://message', {
    uuid,
    sender: socket.auth.deviceId,
    receiver,
    type: 'text',
    content: uuid,
    createdAt: null,
    updatedAt: null,
  });
  assert.equal(result.statusCode, 200);
  assert.equal(result.data.uuid, uuid);
}
try {
  const desktop = await connect('desktop');
  let web = await connect('web');
  console.log('READY');
  await waitFor(() => received.has(`backlog-${phase}`));
  // Exercise both directions and enough messages to exceed one queue batch.
  await Promise.all(
    Array.from({ length: 60 }, (_, i) =>
      send(
        i % 2 ? desktop : web,
        i % 2 ? 'web' : 'desktop',
        `live-${phase}-${i}`,
      ),
    ),
  );
  await waitFor(() => received.size === 61);

  // A stale disconnect must not remove the replacement socket for the device.
  const previous = web;
  web = await connect('web');
  previous.disconnect();
  await send(desktop, 'web', `reconnect-${phase}`);
  await waitFor(() => received.has(`reconnect-${phase}`));
  await send(desktop, 'web', `retry-${phase}`);
  await waitFor(() => received.get(`retry-${phase}`) === 2);
  await send(desktop, 'offline', `offline-${phase}`);
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(received.size, 63);
  assert.ok(
    [...received].every(
      ([uuid, count]) => count === (uuid === `retry-${phase}` ? 2 : 1),
    ),
    'Unexpected duplicate delivery',
  );
  console.log(
    'PASS: backlog, bidirectional burst, reconnect, offline, lost-ACK retry, no unexpected duplicates',
  );
} finally {
  sockets.forEach((socket) => socket.disconnect());
}
