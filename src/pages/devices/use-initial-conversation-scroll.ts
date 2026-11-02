import { useEffect, useRef } from 'react';

type ConversationVirtualizer = {
  scrollToIndex: (index: number, options: { align: 'end' }) => void;
};

export function useInitialConversationScroll(
  virtualizer: ConversationVirtualizer,
  conversationId: string | undefined,
  messageCount: number,
) {
  const position = useRef({ conversationId, applied: false });

  useEffect(() => {
    // StrictMode reconnects the virtualizer after cleanup; its first scroll must run again.
    return () => {
      position.current.applied = false;
    };
  }, []);

  useEffect(() => {
    if (position.current.conversationId !== conversationId) {
      position.current = { conversationId, applied: false };
    }
    if (!conversationId || !messageCount || position.current.applied) return;

    // Wait for messages, not a fixed timeout; reuse the viewport when switching conversations.
    virtualizer.scrollToIndex(messageCount - 1, { align: 'end' });
    position.current.applied = true;
  }, [virtualizer, conversationId, messageCount]);
}
