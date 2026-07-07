import { env } from '@/config/env';

export interface BackendAuthSession {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  user: Record<string, unknown>;
}

function endpoint(path: string) {
  return `${env.backendUrl.replace(/\/$/, '')}${path}`;
}

async function parseAuthResponse(response: Response): Promise<BackendAuthSession> {
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const detail = body?.detail ?? 'Request failed';
    throw new Error(typeof detail === 'string' ? detail : 'Request failed');
  }
  return body as BackendAuthSession;
}

export async function usernameSignIn(username: string, password: string) {
  return fetch(endpoint('/auth/username/sign-in'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then(parseAuthResponse);
}

export async function usernameSignUp(username: string, password: string) {
  return fetch(endpoint('/auth/username/sign-up'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then(parseAuthResponse);
}
