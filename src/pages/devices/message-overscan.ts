const CODE_NODE = /"type"\s*:\s*"code(?:-plus)?"/;

export function getMessageOverscan(
  messages: readonly Pick<IMessage, 'type' | 'content'>[],
): number {
  // Code blocks mount many token nodes; keep the wider buffer for lightweight chats.
  return messages.some(
    (message) =>
      message.type === 'text' &&
      message.content &&
      CODE_NODE.test(message.content),
  )
    ? 3
    : 8;
}
