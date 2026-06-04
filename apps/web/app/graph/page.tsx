'use client';

import { useState } from 'react';
import { GlassCard } from '@cortex/ui';
import { CortexNav } from '@/components/cortex-nav';

export default function GraphExplorerPage() {
  const [query, setQuery] = useState('Acme');
  const [result, setResult] = useState<string>('');

  async function explore() {
    const res = await fetch('/api/executive-ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: `What entities and relationships exist for ${query}?` }),
    });
    const data = (await res.json()) as { answer?: string; error?: string };
    setResult(data.answer ?? data.error ?? 'No result');
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <CortexNav />
      <h1 className="gradient-text text-3xl font-bold">Graph Explorer</h1>
      <p className="mt-2 text-[#94a3b8]">Query the knowledge graph via hybrid retrieval.</p>
      <GlassCard className="mt-6 p-4">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
            placeholder="Entity name (e.g. Acme)"
          />
          <button
            type="button"
            onClick={() => explore()}
            className="btn-gradient px-4 py-2 text-sm"
          >
            Explore
          </button>
        </div>
        {result && <pre className="mt-4 whitespace-pre-wrap text-sm text-[#cbd5e1]">{result}</pre>}
      </GlassCard>
    </div>
  );
}
