'use client';

import { CheckCircle2, Circle } from 'lucide-react';
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

const ACTIVE_CONNECTORS = [
  { id: 'google-workspace', connectAs: 'google', label: 'Google Workspace' },
  { id: 'github', connectAs: 'github', label: 'GitHub' },
] as const;

const COMING_SOON = [
  { id: 'notion', label: 'Notion' },
  { id: 'linear', label: 'Linear' },
  { id: 'discord', label: 'Discord' },
];

export default function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded, tenantId } = useCortexUser();
  const [connectors, setConnectors] = useState<ConnectorRow[]>([]);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [connectError, setConnectError] = useState('');
  const [optimisticConnected, setOptimisticConnected] = useState<Set<string>>(new Set());
  const handledRedirect = useRef<string | null>(null);

  function refreshStatus() {
    if (!tenantId) return;
    const q = `?tenant_id=${tenantId}`;
    fetch(`/api/onboarding/status`)
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
    fetch(`/api/admin/connectors-status${q}`)
      .then((r) => r.json())
      .then((d: { status: ConnectorRow[] }) => setConnectors(d.status ?? []))
      .catch(() => null);
  }

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setConnectError(decodeURIComponent(err));
  }, [searchParams]);

  useEffect(() => {
    if (!isLoaded || !tenantId) return;
    refreshStatus();
    const t = setInterval(refreshStatus, 3000);
    return () => clearInterval(t);
  }, [isLoaded, tenantId]);

  useEffect(() => {
    const success = searchParams.get('success');
    const connected = searchParams.get('connected');
    const key = success ?? connected;
    if (!key || !tenantId || handledRedirect.current === key) return;
    handledRedirect.current = key;
    setConnectError('');
    setOptimisticConnected((prev) => new Set(prev).add(key));
    refreshStatus();

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

  function isConnected(providerId: string): boolean {
    const row = connectors.find((r) => r.provider === providerId);
    return Boolean(row?.healthy || optimisticConnected.has(providerId));
  }

  function connect(connectAs: string) {
    if (!tenantId) return;
    window.location.href = `/api/auth/connect/${encodeURIComponent(connectAs)}`;
  }

  const googleConnected = isConnected('google-workspace');
  const githubConnected = isConnected('github');
  const bothConnected = googleConnected && githubConnected;
  const done = status?.status === 'complete';
  const ingesting = status?.status === 'running';

  const percent = done
    ? 100
    : bothConnected
      ? ingesting
        ? 70
        : 50
      : googleConnected || githubConnected
        ? 35
        : 10;

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

        {bothConnected && (
          <div className="mt-6 flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            Both tools connected — you can enter the platform now.
          </div>
        )}

        <div className="mt-8 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-[#14b8a6] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          {done
            ? 'Ingestion complete — full context ready'
            : ingesting
              ? 'Ingesting your data in the background…'
              : bothConnected
                ? 'Ready to chat — indexing continues in the background'
                : `Step: ${status?.step ?? 'connect_tools'}`}
        </p>

        <ul className="mt-10 space-y-3">
          {ACTIVE_CONNECTORS.map((c) => {
            const connected = isConnected(c.id);
            return (
              <li
                key={c.id}
                className={`flex items-center justify-between border px-4 py-4 transition-colors ${
                  connected ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-white/10 bg-black'
                }`}
              >
                <div className="flex items-center gap-3">
                  {connected ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-zinc-600" aria-hidden />
                  )}
                  <div>
                    <p className="font-medium">{c.label}</p>
                    <p
                      className={`text-xs ${connected ? 'font-medium text-emerald-400' : 'text-zinc-500'}`}
                    >
                      {connected ? 'Connected successfully' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => connect(c.connectAs)}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                    connected
                      ? 'border border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/30'
                      : 'bg-[#14b8a6] text-black hover:bg-[#0d9488]'
                  }`}
                >
                  {connected ? 'Reconnect' : 'Connect'}
                </button>
              </li>
            );
          })}

          {COMING_SOON.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between border border-white/5 bg-zinc-950 px-4 py-4 opacity-50"
            >
              <div className="flex items-center gap-3">
                <Circle className="h-5 w-5 shrink-0 text-zinc-700" aria-hidden />
                <div>
                  <p className="font-medium">{c.label}</p>
                  <p className="text-xs text-zinc-600">Coming soon</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {bothConnected && (
          <div className="mt-12 space-y-3">
            <Link
              href="/executive-desk"
              className="inline-block w-full bg-white px-8 py-4 text-center text-sm font-semibold text-black hover:bg-zinc-100"
            >
              Enter Executive Desk →
            </Link>
            {!done && (
              <p className="text-center text-xs text-zinc-500">
                You can ask questions now. Answers improve as ingestion finishes.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
