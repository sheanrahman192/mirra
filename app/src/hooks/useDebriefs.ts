import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDebriefs } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { ConversationListItem } from '@/models/conversation';
import { DebriefCard } from '@/models/debrief';
import { formatConversationWhen, formatDuration } from '@/utils/timeFormat';

function titleForDebrief(debrief: DebriefCard) {
  return debrief.observation.split(/[.!?]/)[0]?.trim() || 'Conversation debrief';
}

function toneForDebrief(debrief: DebriefCard) {
  const ratio = debrief.stats.talkListenRatio;
  if (ratio > 0.65) return 'coral';
  if (debrief.stats.questionCount >= 8) return 'sage';
  if (debrief.stats.interruptionCount > 2) return 'terracotta';
  return 'lavender';
}

export function toConversationListItem(debrief: DebriefCard): ConversationListItem {
  return {
    id: debrief.id,
    title: titleForDebrief(debrief),
    when: formatConversationWhen(debrief.createdAt),
    duration: formatDuration(Math.round(debrief.stats.sessionDurationMinutes * 60)),
    tone: toneForDebrief(debrief),
    note: debrief.thingToTryNext,
  };
}

export function useDebriefs() {
  const { accessToken } = useAuth();
  const [debriefs, setDebriefs] = useState<DebriefCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      setDebriefs(await fetchDebriefs(accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load debriefs');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const listItems = useMemo(() => debriefs.map(toConversationListItem), [debriefs]);

  return { debriefs, listItems, loading, error, refresh, setDebriefs };
}
