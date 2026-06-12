import { createLogger, loadRootEnv, saveConnectorToken, type CortexEvent } from '@cortex/shared';

loadRootEnv(import.meta.url);
import { publishEvent, TOPICS } from '@cortex/shared/kafka';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

import {
  buildConnectUrl,
  decodeOAuthState,
  exchangeOAuthCode,
  GOOGLE_SCOPES,
  oauthCallbackUrl,
} from './oauth';

const log = createLogger('integration-service');
const port = Number(process.env.INTEGRATION_SERVICE_PORT ?? 3010);

async function publishRawEvent(event: CortexEvent, tenantId?: string): Promise<void> {
  try {
    await publishEvent(TOPICS.RAW_EVENTS, event, tenantId ? { tenantId } : undefined);
    log.info({ eventId: event.id, source: event.source, tenantId }, 'published raw.events');
  } catch (err) {
    log.warn({ err }, 'Kafka unavailable — event logged only');
  }
}

async function upsertConnectorHealth(
  tenantId: string,
  provider: string,
  status: string,
  connectionId?: string,
): Promise<void> {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(
    `INSERT INTO connector_health (tenant_id, provider, status, nango_connection_id, last_sync_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (tenant_id, provider) DO UPDATE SET
       status = EXCLUDED.status,
       nango_connection_id = COALESCE(EXCLUDED.nango_connection_id, connector_health.nango_connection_id),
       last_sync_at = NOW()`,
    [tenantId, provider, status, connectionId ?? null],
  );
  await pool.end();
}

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return Response.json({
        ok: true,
        oauthCallback: oauthCallbackUrl(),
        google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      });
    }

    if (url.pathname === '/oauth/connect' && req.method === 'GET') {
      const provider = url.searchParams.get('provider') ?? 'google-workspace';
      const tenantId = url.searchParams.get('tenant_id');
      const returnUrl = url.searchParams.get('return_url') ?? 'http://localhost:3000/onboarding';
      if (!tenantId) {
        return Response.json({ error: 'tenant_id required' }, { status: 400 });
      }
      try {
        const authUrl = buildConnectUrl({ provider, tenantId, returnUrl });
        return Response.redirect(authUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'OAuth not configured';
        return Response.json({ error: message }, { status: 400 });
      }
    }

    if (url.pathname === '/oauth/callback' && req.method === 'GET') {
      const code = url.searchParams.get('code');
      const stateRaw = url.searchParams.get('state');
      const oauthError = url.searchParams.get('error');

      if (oauthError) {
        return Response.redirect(
          `http://localhost:3000/onboarding?error=${encodeURIComponent(oauthError)}`,
        );
      }
      if (!code || !stateRaw) {
        return Response.json({ error: 'Missing code or state' }, { status: 400 });
      }

      const state = decodeOAuthState(stateRaw);
      if (!state) {
        return Response.json({ error: 'Invalid OAuth state' }, { status: 400 });
      }

      try {
        const tokens = await exchangeOAuthCode(state.provider, code);
        await saveConnectorToken(state.tenantId, state.provider as 'google-workspace' | 'github', {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          scope: tokens.scope,
        });

        const connectionId = `${state.tenantId}-${state.provider}`;
        await upsertConnectorHealth(state.tenantId, state.provider, 'connected', connectionId);
        if (state.provider === 'google-workspace') {
          for (const sub of ['gmail', 'drive', 'calendar', 'contacts', 'tasks']) {
            await upsertConnectorHealth(state.tenantId, `google-${sub}`, 'connected', connectionId);
          }
        }

        const returnTo = new URL(state.returnUrl);
        returnTo.searchParams.set('connected', state.provider);
        return Response.redirect(returnTo.toString());
      } catch (err) {
        log.error(
          { err, tenantId: state.tenantId, provider: state.provider },
          'OAuth callback failed',
        );
        const returnTo = new URL(state.returnUrl);
        returnTo.searchParams.set('error', 'oauth_failed');
        return Response.redirect(returnTo.toString());
      }
    }

    if (url.pathname === '/api/connectors/status' && req.method === 'GET') {
      const tenantId = url.searchParams.get('tenant_id');
      const core = ['google-workspace', 'github', 'notion', 'linear', 'slack'];

      const dbStatus: Record<string, { healthy: boolean; lastSync?: string }> = {};
      if (tenantId && process.env.DATABASE_URL) {
        const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
        const r = await pool.query(
          `SELECT provider, status, last_sync_at FROM connector_health WHERE tenant_id = $1`,
          [tenantId],
        );
        await pool.end();
        for (const row of r.rows) {
          dbStatus[row.provider] = {
            healthy: row.status === 'connected',
            lastSync: row.last_sync_at,
          };
        }
      }

      const status = core.map((provider) => {
        const row = dbStatus[provider];
        if (row) return { provider, healthy: row.healthy, lastSync: row.lastSync };
        return { provider, healthy: false, reason: 'not connected' };
      });
      return Response.json({ status, googleScopes: GOOGLE_SCOPES.join(' ') });
    }

    if (url.pathname === '/sync' && req.method === 'POST') {
      const body = (await req.json()) as { provider?: string; tenantId?: string };
      const event: CortexEvent = {
        id: randomUUID(),
        source: body.provider ?? 'unknown',
        type: 'sync.requested',
        timestamp: new Date().toISOString(),
        payload: body,
      };
      await publishRawEvent(event, body.tenantId);
      return Response.json({ ok: true });
    }

    return new Response('Not found', { status: 404 });
  },
});

log.info({ port: server.port, callback: oauthCallbackUrl() }, 'integration-service listening');
