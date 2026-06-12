'use client';

import { useEffect, useState } from 'react';

import { CortexNav } from '@/components/cortex-nav';
import { useCortexUser } from '@/hooks/use-cortex-user';

type ConnectorStatus = { provider: string; healthy: boolean; reason?: string; lastSync?: string };

export default function AdminConnectionsPage() {
  const { tenantId } = useCortexUser();
  const [rows, setRows] = useState<ConnectorStatus[]>([]);
  const [oauthReady, setOauthReady] = useState(false);
  const integrationBase =
    process.env.NEXT_PUBLIC_INTEGRATION_SERVICE_URL ?? 'http://localhost:3010';

  useEffect(() => {
    fetch('/api/admin/connectors-status')
      .then((r) => r.json())
      .then((d: { status: ConnectorStatus[] }) => {
        setRows(d.status ?? []);
      });
    fetch(`${integrationBase}/health`)
      .then((r) => r.json())
      .then((d: { ok?: boolean }) => setOauthReady(!!d.ok))
      .catch(() => setOauthReady(false));
  }, []);

  function connect(provider: string) {
    if (!tenantId) return;
    window.location.href = `${integrationBase}/oauth/connect?provider=${provider}&tenant_id=${tenantId}&return_url=${encodeURIComponent(`${window.location.origin}/admin/connections`)}`;
  }

  async function startIngest(provider: string) {
    await fetch('/api/onboarding/connected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 text-white">
      <CortexNav />
      <h1 className="font-display text-3xl">Admin · Connections</h1>
      <p className="mt-2 text-zinc-500">
        OAuth service: {oauthReady ? 'ready' : 'down'} · tenant: {tenantId ?? '—'}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.provider} className="border border-white/10 bg-[#0f0f0f] p-4">
            <p className="font-medium capitalize">{row.provider.replace(/-/g, ' ')}</p>
            <p className={`mt-2 text-sm ${row.healthy ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {row.healthy
                ? `Connected${row.lastSync ? ` · ${row.lastSync}` : ''}`
                : (row.reason ?? 'Not connected')}
            </p>
            <div className="mt-4 flex gap-2">
              {(row.provider === 'google-workspace' || row.provider === 'github') && (
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
