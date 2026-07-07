import { env } from '@/config/env';

export interface AuthStatus {
  usernamePasswordReady: boolean;
  googleEnabled: boolean;
  emailEnabled: boolean;
  signupDisabled: boolean;
}

function endpoint(path: string) {
  return `${env.backendUrl.replace(/\/$/, '')}${path}`;
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
  const response = await fetch(endpoint('/auth/status'));
  const body = await response.json();
  if (!response.ok) throw new Error(body?.detail ?? 'Could not load auth status');
  return {
    usernamePasswordReady: Boolean(body.username_password_ready),
    googleEnabled: Boolean(body.google_enabled),
    emailEnabled: Boolean(body.email_enabled),
    signupDisabled: Boolean(body.signup_disabled),
  };
}
