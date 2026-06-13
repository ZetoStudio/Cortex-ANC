'use client';

import { useEffect, useState } from 'react';

import { CortexNav } from '@/components/cortex-nav';
import { useCortexUser } from '@/hooks/use-cortex-user';

type ConnectorStatus = { provider: string; healthy: boolean; reason?: string; lastSync?: string };

export default function AdminConnectionsPage() {
  const { tenantId, user } = useCortexUser();
  const [rows, setRows] = useState<ConnectorStatus[]>([]);
  const [oauthReady, setOauthReady] = useState(false);
  const [syncingNotion, setSyncingNotion] = useState(false);
  const integrationBase =
    process.env.NEXT_PUBLIC_INTEGRATION_SERVICE_URL ?? 'http://localhost:3010';

  const isAdmin = user?.role === 'admin';

  function refresh() {
    fetch('/api/admin/connectors-status')
      .then((r) => r.json())
      .then((d: { status: ConnectorStatus[] }) => {
        setRows(d.status ?? []);
      });
  }

  useEffect(() => {
    refresh();
    fetch(`${integrationBase}/health`)
      .then((r) => r.json())
      .then((d: { ok?: boolean }) => setOauthReady(!!d.ok))
      .catch(() => setOauthReady(false));
  }, []);

  function connect(provider: string) {
    if (!tenantId || !isAdmin) return;
    window.location.href = `/api/auth/connect/${encodeURIComponent(provider === 'google-workspace' ? 'google' : provider)}`;
  }

  async function startIngest(provider: string) {
    await fetch('/api/ingestion/resync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    refresh();
  }

  async function connectNotion() {
    if (!isAdmin || syncingNotion) return;
    setSyncingNotion(true);
    try {
      const res = await fetch('/api/connections/notion', { method: 'POST' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Connect failed');
      }
      refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingNotion(false);
    }
  }

  const notionRow = rows.find((r) => r.provider === 'notion');

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 text-white">
      <CortexNav />
      <h1 className="font-display text-3xl">Admin · Connections</h1>
      <p className="mt-2 text-zinc-500">
        OAuth service: {oauthReady ? 'ready' : 'down'} · tenant: {tenantId ?? '—'}
      </p>
      {!isAdmin && (
        <p className="mt-4 text-sm text-amber-400">
          Admin role required to connect or re-sync tools.
        </p>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.provider} className="border border-white/10 bg-[#0f0f0f] p-4">
            <p className="font-medium capitalize">{row.provider.replace(/-/g, ' ')}</p>
            <p className={`mt-2 text-sm ${row.healthy ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {row.healthy
                ? `Connected${row.lastSync ? ` · Last sync ${new Date(row.lastSync).toLocaleString()}` : ''}`
                : (row.reason ?? 'Not connected')}
            </p>
            <div className="mt-4 flex gap-2">
              {(row.provider === 'google-workspace' || row.provider === 'github') && isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => connect(row.provider)}
                    className="bg-[#14b8a6] px-3 py-1.5 text-xs font-semibold text-black"
                  >
                    Connect
                  </button>
                  {row.healthy && (
                    <button
                      type="button"
                      onClick={() => startIngest(row.provider)}
                      className="border border-white/20 px-3 py-1.5 text-xs text-white"
                    >
                      Sync now
                    </button>
                  )}
                </>
              )}
              {row.provider === 'notion' && isAdmin && (
                <>
                  {!row.healthy && (
                    <button
                      type="button"
                      onClick={connectNotion}
                      disabled={syncingNotion}
                      className="bg-[#14b8a6] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                    >
                      {syncingNotion ? 'Connecting…' : 'Connect'}
                    </button>
                  )}
                  {row.healthy && (
                    <button
                      type="button"
                      onClick={connectNotion}
                      disabled={syncingNotion}
                      className="border border-white/20 px-3 py-1.5 text-xs text-white disabled:opacity-50"
                    >
                      {syncingNotion ? 'Syncing…' : 'Re-sync'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {!notionRow && (
          <div className="border border-white/10 bg-[#0f0f0f] p-4">
            <p className="font-medium capitalize">Notion</p>
            <p className="mt-2 text-sm text-zinc-500">Not connected</p>
            {isAdmin && (
              <button
                type="button"
                onClick={connectNotion}
                disabled={syncingNotion}
                className="mt-4 bg-[#14b8a6] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
              >
                {syncingNotion ? 'Connecting…' : 'Connect'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
