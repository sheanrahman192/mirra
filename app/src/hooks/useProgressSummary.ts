import { useCallback, useEffect, useState } from 'react';
import { fetchProgressSummary } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { ProgressSummary } from '@/models/debrief';

export function useProgressSummary() {
  const { accessToken } = useAuth();
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setProgress(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setProgress(await fetchProgressSummary(accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load progress');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { progress, loading, error, refresh };
}
