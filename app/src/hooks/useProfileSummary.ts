import { useCallback, useEffect, useState } from 'react';
import { fetchProfileSummary } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { ProfileSummary } from '@/models/debrief';

export function useProfileSummary() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setSummary(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSummary(await fetchProfileSummary(accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load profile summary');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}
