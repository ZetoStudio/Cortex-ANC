'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useCortexUser } from '@/hooks/use-cortex-user';

type ConnectorRow = { provider: string; healthy: boolean; reason?: string; lastSync?: string };
type OnboardingStatus = {
  status: string;
  step: string;
  progress: Record<string, unknown>;
  workflow?: { percent?: number };
};

const CONNECTORS = [
  { id: 'google-workspace', connectAs: 'google', label: 'Google Workspace', active: true },
  { id: 'github', connectAs: 'github', label: 'GitHub', active: true },
  { id: 'notion', connectAs: 'notion', label: 'Notion', active: false },
  { id: 'linear', connectAs: 'linear', label: 'Linear', active: false },
  { id: 'discord', connectAs: 'discord', label: 'Discord', active: false },
];

export default function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded, tenantId } = useCortexUser();
  const [connectors, setConnectors] = useState<ConnectorRow[]>([]);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [connectError, setConnectError] = useState('');
  const handledRedirect = useRef<string | null>(null);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setConnectError(decodeURIComponent(err));
  }, [searchParams]);

  useEffect(() => {
    if (!isLoaded || !tenantId) return;
    const q = `?tenant_id=${tenantId}`;
    fetch(`/api/onboarding/status`)
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
    fetch(`/api/admin/connectors-status${q}`)
      .then((r) => r.json())
      .then((d: { status: ConnectorRow[] }) => setConnectors(d.status ?? []))
      .catch(() => null);
    const t = setInterval(() => {
      fetch('/api/onboarding/status')
        .then((r) => r.json())
        .then(setStatus)
        .catch(() => null);
      fetch(`/api/admin/connectors-status${q}`)
        .then((r) => r.json())
        .then((d: { status: ConnectorRow[] }) => setConnectors(d.status ?? []))
        .catch(() => null);
    }, 3000);
    return () => clearInterval(t);
  }, [isLoaded, tenantId]);

  useEffect(() => {
    const success = searchParams.get('success');
    const connected = searchParams.get('connected');
    const key = success ?? connected;
    if (!key || !tenantId || handledRedirect.current === key) return;
    handledRedirect.current = key;
    setConnectError('');

    if (success) {
      router.replace('/onboarding');
      return;
    }

    fetch('/api/onboarding/connected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: connected }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? `Connect failed (${r.status})`);
        }
        router.replace('/onboarding');
      })
      .catch((e: Error) => setConnectError(e.message));
  }, [searchParams, tenantId, router]);

  function connect(connectAs: string) {
    if (!tenantId) return;
    window.location.href = `/api/auth/connect/${encodeURIComponent(connectAs)}`;
  }

  const percent =
    status?.status === 'complete'
      ? 100
      : (status?.workflow?.percent ?? (status?.status === 'running' ? 50 : 10));
  const done = status?.status === 'complete';
  const googleConnected = connectors.find((r) => r.provider === 'google-workspace')?.healthy;
  const githubConnected = connectors.find((r) => r.provider === 'github')?.healthy;

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
        <p>Sign in to set up your workspace.</p>
        <Link href="/auth/login" className="text-[#14b8a6] hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#14b8a6]">Onboarding</p>
        <h1 className="mt-4 font-display text-3xl">Connect your tools</h1>
        <p className="mt-2 text-zinc-400">
          Authorize Google Workspace and GitHub. Cortex ingests your real data — no demo seed.
        </p>

        {connectError && (
          <p className="mt-4 rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {connectError}
          </p>
        )}

        <div className="mt-10 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-[#14b8a6] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          {done
            ? 'Ingestion complete'
            : status?.status === 'running'
              ? 'Ingesting your data…'
              : `Step: ${status?.step ?? 'connect_tools'}`}
        </p>

        <ul className="mt-10 space-y-3">
          {CONNECTORS.map((c) => {
            const row = connectors.find((r) => r.provider === c.id);
            const connected = row?.healthy;
            return (
              <li
                key={c.id}
                className={`flex items-center justify-between border px-4 py-4 ${
                  c.active ? 'border-white/10 bg-black' : 'border-white/5 bg-zinc-950 opacity-50'
                }`}
              >
                <div>
                  <p className="font-medium">{c.label}</p>
                  <p className="text-xs text-zinc-500">
                    {connected
                      ? 'Connected'
                      : row?.reason
                        ? row.reason
                        : c.active
                          ? 'Not connected'
                          : 'Coming soon'}
                  </p>
                </div>
                {c.active && (
                  <button
                    type="button"
                    disabled={!c.active}
                    onClick={() => connect(c.connectAs)}
                    className="bg-[#14b8a6] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black disabled:opacity-40"
                  >
                    {connected ? 'Reconnect' : 'Connect'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {(googleConnected || githubConnected) && !done && (
          <p className="mt-6 text-sm text-zinc-400">
            Connected — ingestion runs in the background. This page updates automatically.
          </p>
        )}

        {done && (
          <Link
            href="/executive-desk"
            className="mt-12 inline-block bg-white px-8 py-3 text-sm font-semibold text-black"
          >
            Go to Executive Desk →
          </Link>
        )}
      </div>
    </div>
  );
}
