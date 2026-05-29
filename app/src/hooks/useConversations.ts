import { useCallback, useEffect, useState } from 'react';
import { Conversation, ConversationListItem } from '@/models/conversation';
import { addConversation, listConversations } from '@/storage/conversationStore';
import { formatConversationWhen, formatDuration } from '@/utils/timeFormat';

function toListItem(c: Conversation): ConversationListItem {
  return {
    id: c.id,
    title: c.title,
    when: formatConversationWhen(c.uploadedAt),
    duration: formatDuration(c.durationSeconds),
    tone: c.tone,
    note: c.note,
  };
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const items = await listConversations();
    setConversations(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (conversation: Conversation) => {
      await addConversation(conversation);
      await refresh();
    },
    [refresh]
  );

  return {
    conversations,
    listItems: conversations.map(toListItem),
    loading,
    refresh,
    save,
  };
}
