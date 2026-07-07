import { useCallback, useEffect, useState } from 'react';
import { fetchUsage } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { UsageSummary } from '@/models/debrief';

export function useUsage() {
  const { accessToken } = useAuth();
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setUsage(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setUsage(await fetchUsage(accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load usage');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { usage, loading, error, refresh };
}
