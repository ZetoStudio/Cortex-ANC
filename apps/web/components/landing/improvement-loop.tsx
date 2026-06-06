'use client';

import Link from 'next/link';
import { Activity, Brain, Gauge, RefreshCw, Shield } from 'lucide-react';

import { useInView } from '@/hooks/use-in-view';

const LOOP = [
  { icon: Activity, label: 'Sensor', desc: 'Ingest events' },
  { icon: Shield, label: 'Policy', desc: 'RBAC + rules' },
  { icon: RefreshCw, label: 'Tools', desc: '700+ connectors' },
  { icon: Gauge, label: 'Quality', desc: 'QA sweep' },
  { icon: Brain, label: 'Learning', desc: 'Improve overnight' },
];

export function ImprovementLoop() {
  const { ref, visible } = useInView(0.15);

  return (
    <section className="overflow-hidden border-t border-white/5 bg-black py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-[1400px] px-6 md:px-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">Self-improving</p>
        <h2 className="mt-3 font-display text-4xl text-white md:text-5xl">
          Cortex learns while you sleep.
        </h2>
        <p className="mt-4 max-w-md text-sm text-zinc-500">
          Monitor → policy → act → measure → improve. An infinite loop that tightens retrieval and
          workflow quality every night.
        </p>

        <div className={`improvement-loop mt-16 ${visible ? 'improvement-loop-active' : ''}`}>
          <div className="improvement-orbit">
            {LOOP.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className="improvement-node"
                style={{ '--i': i, '--total': LOOP.length } as React.CSSProperties}
              >
                <div className="improvement-node-card">
                  <Icon className="size-5 text-teal-400" />
                  <span className="text-sm font-medium text-white">{label}</span>
                  <span className="text-[10px] text-zinc-500">{desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="improvement-core">
            <span className="font-mono text-xs uppercase tracking-widest text-teal-500/80">
              Loop
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 bg-black px-6 py-12 md:px-12">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-xs text-zinc-600">
          Powered by <span className="text-zinc-400">Cortex</span>
        </p>
        <Link
          href="/auth/login"
          className="font-mono text-xs text-zinc-600 transition-colors hover:text-teal-400"
        >
          Admin login →
        </Link>
      </div>
    </footer>
  );
}
