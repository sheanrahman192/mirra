import { env } from '@/config/env';
import { DebriefCard, SessionResponse, UsageSummary } from '@/models/debrief';

type RawStats = {
  talk_listen_ratio: number;
  question_count: number;
  interruption_count: number;
  session_duration_minutes: number;
  user_speech_duration_minutes: number;
  estimated_wpm: number;
};

type RawDebrief = {
  id: string;
  session_id: string;
  user_id: string;
  created_at: string;
  observation: string;
  pattern_to_reduce: string;
  thing_to_try_next: string;
  stats: RawStats;
  transcript?: string | null;
};

type RawUsage = {
  used_this_month: number;
  remaining: number;
  resets_at: string;
};

function endpoint(path: string) {
  return `${env.backendUrl.replace(/\/$/, '')}${path}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const detail = body?.detail ?? 'Request failed';
    throw new Error(typeof detail === 'string' ? detail : 'Request failed');
  }
  return body as T;
}

function toStats(raw: RawStats) {
  return {
    talkListenRatio: raw.talk_listen_ratio,
    questionCount: raw.question_count,
    interruptionCount: raw.interruption_count,
    sessionDurationMinutes: raw.session_duration_minutes,
    userSpeechDurationMinutes: raw.user_speech_duration_minutes,
    estimatedWpm: raw.estimated_wpm,
  };
}

export function toDebrief(raw: RawDebrief): DebriefCard {
  return {
    id: raw.id,
    sessionId: raw.session_id,
    userId: raw.user_id,
    createdAt: raw.created_at,
    observation: raw.observation,
    patternToReduce: raw.pattern_to_reduce,
    thingToTryNext: raw.thing_to_try_next,
    stats: toStats(raw.stats),
    transcript: raw.transcript,
  };
}

function toUsage(raw: RawUsage): UsageSummary {
  return {
    usedThisMonth: raw.used_this_month,
    remaining: raw.remaining,
    resetsAt: raw.resets_at,
  };
}

export async function fetchUsage(token: string): Promise<UsageSummary> {
  const raw = await fetch(endpoint('/usage'), {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => parseResponse<RawUsage>(r));
  return toUsage(raw);
}

export async function fetchDebriefs(token: string): Promise<DebriefCard[]> {
  const raw = await fetch(endpoint('/debriefs'), {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => parseResponse<RawDebrief[]>(r));
  return raw.map(toDebrief);
}

export async function uploadSession(
  token: string,
  audio: { uri: string; name: string; type: string },
  metadata: { title?: string; clientDurationSeconds?: number }
): Promise<SessionResponse> {
  const form = new FormData();
  form.append('audio', audio as unknown as Blob);
  form.append('started_at', new Date().toISOString());
  if (metadata.title) form.append('title', metadata.title);
  if (metadata.clientDurationSeconds != null) {
    form.append('client_duration_seconds', String(metadata.clientDurationSeconds));
  }

  const raw = await fetch(endpoint('/sessions'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  }).then((r) => parseResponse<{ debrief: RawDebrief; used_this_month: number; remaining: number }>(r));

  return {
    debrief: toDebrief(raw.debrief),
    usedThisMonth: raw.used_this_month,
    remaining: raw.remaining,
  };
}
