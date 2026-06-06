'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { AppShell } from '@/components/app-shell';

type Stats = {
  connectors: number;
  pendingApprovals: number;
  documentCount: number;
  nodeCount: number;
  edgeCount: number;
  eventCount: number;
  improvementCount: number;
  kafka: string;
  nango: string;
  eventTimeline: { day: string; count: number }[];
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Events ingested', value: stats?.eventCount ?? '—' },
    { label: 'Active connectors', value: stats?.connectors ?? '—' },
    { label: 'Graph nodes', value: stats?.nodeCount ?? '—' },
    { label: 'Graph edges', value: stats?.edgeCount ?? '—' },
    { label: 'Documents indexed', value: stats?.documentCount ?? '—' },
    { label: 'Pending approvals', value: stats?.pendingApprovals ?? '—' },
    { label: 'Improvement suggestions', value: stats?.improvementCount ?? '—' },
  ];

  return (
    <AppShell title="Admin Dashboard" subtitle="Platform health and activity">
      <div className="h-full overflow-y-auto p-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="paper-card h-24 animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((s) => (
                <div key={s.label} className="paper-card p-5">
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-[#111111]">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="paper-card mt-6 p-5">
              <h2 className="text-sm font-medium text-[#111111]">Q&A activity (last 7 days)</h2>
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.eventTimeline ?? []}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 grid gap-4 text-sm text-gray-600 sm:grid-cols-2">
              <div className="paper-card-inset p-4">
                <p>Kafka: {stats?.kafka ?? '—'}</p>
                <p className="mt-1">Nango: {stats?.nango ?? '—'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/connections" className="btn-secondary text-sm">
                  Connections
                </Link>
                <Link href="/admin/logs" className="btn-secondary text-sm">
                  Logs
                </Link>
                <Link href="/admin/improvements" className="btn-secondary text-sm">
                  Improvements
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
