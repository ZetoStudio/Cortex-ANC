'use client';

import { useEffect, useState } from 'react';
import { Badge, GlassCard } from '@cortex/ui';
import { CortexNav } from '@/components/cortex-nav';

type Connector = { id: string; name: string; status: string };

export default function ConnectorsPage() {
  const [nango, setNango] = useState(false);
  const [connectors, setConnectors] = useState<Connector[]>([]);

  useEffect(() => {
    fetch('/api/connectors')
      .then((r) => r.json())
      .then((d: { connectors: Connector[] }) => setConnectors(d.connectors ?? []));
    fetch(
      `${process.env.NEXT_PUBLIC_INTEGRATION_SERVICE_URL ?? 'http://localhost:3010'}/connections`,
    )
      .then((r) => r.json())
      .then((d: { nangoEnabled?: boolean }) => setNango(!!d.nangoEnabled))
      .catch(() => setNango(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <CortexNav />
      <h1 className="gradient-text text-3xl font-bold">Connectors</h1>
      <p className="mt-2 text-[#94a3b8]">
        OAuth via Nango {nango ? '(connected)' : '(start integration-service + Nango)'}
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {connectors.map((c) => (
          <GlassCard key={c.id} className="flex items-center justify-between p-4">
            <span className="font-medium">{c.name}</span>
            <Badge variant={c.status === 'ready' ? 'cyan' : 'default'}>{c.status}</Badge>
          </GlassCard>
        ))}
      </div>
      <p className="mt-6 text-sm text-[#94a3b8]">
        Run <code>bun run adapt:connectors</code> to import 50+ pieces from activepieces-main.
      </p>
    </div>
  );
}
