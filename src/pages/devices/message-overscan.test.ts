import { expect, test } from 'vitest';

import { getMessageOverscan } from './message-overscan';

test('keeps the existing buffer for plain text and attachments', () => {
  expect(getMessageOverscan([])).toBe(8);
  expect(
    getMessageOverscan([
      { type: 'text', content: 'hello' },
      { type: 'image', content: 'photo.png' },
    ]),
  ).toBe(8);
});

test.each(['code-plus', 'code'])(
  'limits expensive offscreen editors for serialized %s blocks',
  (type) => {
    expect(
      getMessageOverscan([
        {
          type: 'text',
          content: JSON.stringify(
            { root: { children: [{ type, children: [] }] } },
            null,
            2,
          ),
        },
      ]),
    ).toBe(3);
  },
);

test('does not mistake a quoted node definition inside text for an actual code block', () => {
  expect(
    getMessageOverscan([
      {
        type: 'text',
        content: JSON.stringify({
          root: { children: [{ type: 'text', text: '{"type":"code-plus"}' }] },
        }),
      },
    ]),
  ).toBe(8);
});
