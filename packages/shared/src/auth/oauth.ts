const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/tasks.readonly',
];

const GITHUB_SCOPES = ['repo', 'read:org', 'read:user'];

export type OAuthProvider = 'google' | 'github';

export type AccountProvider = OAuthProvider | 'notion';

export type OAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
};

export function normalizeOAuthProvider(provider: string): OAuthProvider | null {
  if (provider === 'google' || provider === 'google-workspace') return 'google';
  if (provider === 'github') return 'github';
  return null;
}

export function connectorHealthProvider(provider: OAuthProvider): string {
  return provider === 'google' ? 'google-workspace' : 'github';
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    'http://localhost:3000'
  );
}

/** Connector OAuth callback — separate from Better Auth sign-in callbacks. */
export function connectorRedirectUri(provider: OAuthProvider): string {
  const envKey =
    provider === 'google' ? 'GOOGLE_CONNECT_REDIRECT_URI' : 'GITHUB_CONNECT_REDIRECT_URI';
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) return fromEnv;
  return `${appBaseUrl()}/api/oauth/callback/${provider}`;
}

export function generateAuthUrl(
  provider: OAuthProvider,
  state: string,
  redirectUri?: string,
): string {
  const redirect = redirectUri ?? connectorRedirectUri(provider);

  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) throw new Error('GOOGLE_CLIENT_ID not configured');
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirect);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', state);
    return url.toString();
  }

  const clientId =
    process.env.GITHUB_CONNECT_CLIENT_ID?.trim() || process.env.GITHUB_CLIENT_ID?.trim();
  if (!clientId) throw new Error('GITHUB_CONNECT_CLIENT_ID not configured');
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirect);
  url.searchParams.set('scope', GITHUB_SCOPES.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeCodeForTokens(
  provider: OAuthProvider,
  code: string,
  redirectUri?: string,
): Promise<OAuthTokens> {
  const redirect = redirectUri ?? connectorRedirectUri(provider);

  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) throw new Error('Google OAuth not configured');

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirect,
        grant_type: 'authorization_code',
      }),
    });
    if (!res.ok) {
      throw new Error(`Google token exchange failed: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      scope: data.scope,
    };
  }

  const clientId =
    process.env.GITHUB_CONNECT_CLIENT_ID?.trim() || process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret =
    process.env.GITHUB_CONNECT_CLIENT_SECRET?.trim() || process.env.GITHUB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error('GitHub connector OAuth not configured');

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirect,
    }),
  });
  if (!res.ok) {
    throw new Error(`GitHub token exchange failed: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    scope?: string;
    error?: string;
  };
  if (data.error) throw new Error(data.error);
  return { accessToken: data.access_token, scope: data.scope };
}

export async function refreshAccessToken(
  provider: OAuthProvider,
  refreshToken: string,
): Promise<OAuthTokens> {
  if (provider !== 'google') {
    throw new Error('GitHub tokens do not support refresh in this flow');
  }
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error('Google OAuth not configured');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google refresh failed: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
    scope?: string;
  };
  return {
    accessToken: data.access_token,
    refreshToken,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    scope: data.scope,
  };
}

export type OAuthState = {
  tenantId: string;
  provider: OAuthProvider;
  returnUrl: string;
};

export function encodeOAuthState(state: OAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString('base64url');
}

export function decodeOAuthState(raw: string): OAuthState | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as OAuthState;
    if (!parsed.tenantId || !parsed.provider || !parsed.returnUrl) return null;
    if (parsed.provider !== 'google' && parsed.provider !== 'github') return null;
    return parsed;
  } catch {
    return null;
  }
}

export { GOOGLE_SCOPES, GITHUB_SCOPES };
