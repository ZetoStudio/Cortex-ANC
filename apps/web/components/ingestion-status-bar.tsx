'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type ProviderProgress = {
  provider: string;
  processed: number;
  total: number;
  status: string;
};

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google Workspace',
  'google-workspace': 'Google Workspace',
  github: 'GitHub',
  notion: 'Notion',
  gmail: 'Gmail',
  drive: 'Drive',
};

export function IngestionStatusBar() {
  const pathname = usePathname();
  const [providers, setProviders] = useState<ProviderProgress[]>([]);
  const [visible, setVisible] = useState(false);

  const hideOnOnboarding = pathname === '/onboarding' || pathname.startsWith('/onboarding/');

  useEffect(() => {
    if (hideOnOnboarding) return;

    let mounted = true;
    async function poll() {
      try {
        const res = await fetch('/api/ingestion/status');
        if (!res.ok) return;
        const data = (await res.json()) as {
          active: boolean;
          providers: ProviderProgress[];
        };
        if (!mounted) return;
        const running = data.providers.filter((p) => p.status === 'running');
        setProviders(running);
        setVisible(data.active && running.length > 0);
      } catch {
        // ignore
      }
    }

    poll();
    const t = setInterval(poll, 3000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [hideOnOnboarding]);

  if (hideOnOnboarding || !visible || providers.length === 0) return null;

  const primary = providers[0];
  const label = PROVIDER_LABELS[primary.provider] ?? primary.provider;
  const total = primary.total > 0 ? primary.total : '…';
  const pct =
    primary.total > 0 ? Math.min(100, Math.round((primary.processed / primary.total) * 100)) : 30;

  return (
    <div
      className="relative z-50 border-b border-[#14b8a6]/20 bg-[#0a1a18] transition-opacity duration-500"
      role="status"
    >
      <div
        className="absolute inset-x-0 bottom-0 h-0.5 bg-[#14b8a6]/30"
        style={{ width: `${pct}%` }}
      />
      <p className="px-4 py-1.5 text-center text-[11px] text-[#14b8a6]">
        Syncing {label} ({primary.processed}/{total})
        {providers.length > 1 ? ` · +${providers.length - 1} more` : ''}…
      </p>
    </div>
  );
}
