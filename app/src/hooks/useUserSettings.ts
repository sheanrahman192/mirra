import { useCallback, useEffect, useState } from 'react';
import { fetchUserSettings, updateUserSettings } from '@/api/client';
import { UserSettings } from '@/models/debrief';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  weeklySummaryDay: 'sunday',
  weeklySummaryTime: 'evening',
  reflectionReminders: false,
  productUpdates: true,
  saveTranscripts: true,
  includeTranscriptInReflect: false,
  coachingTone: 'warm_reflective',
  coachingDepth: 'balanced',
};

export function useUserSettings(token: string | null) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!token) {
      setSettings(DEFAULT_USER_SETTINGS);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchUserSettings(token)
      .then((next) => {
        if (mounted) {
          setSettings(next);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Could not load settings');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const updateSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      if (!token) return;
      const previous = settings;
      const optimistic = { ...settings, ...patch };
      setSettings(optimistic);
      setSaving(true);
      try {
        const saved = await updateUserSettings(token, patch);
        setSettings(saved);
        setError(null);
      } catch (err) {
        setSettings(previous);
        setError(err instanceof Error ? err.message : 'Could not save settings');
      } finally {
        setSaving(false);
      }
    },
    [settings, token]
  );

  return { settings, loading, saving, error, updateSettings };
}
