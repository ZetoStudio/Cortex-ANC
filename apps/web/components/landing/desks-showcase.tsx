'use client';

import Link from 'next/link';
import { Brain, LayoutDashboard, Mail } from 'lucide-react';

import { useInView } from '@/hooks/use-in-view';

const DESKS = [
  {
    icon: LayoutDashboard,
    title: 'Executive Desk',
    href: '/executive-desk',
    offset: 'translate-x-[-6%] rotate-[-2deg]',
    delay: '0s',
    preview: 'What is blocking the Acme launch?',
    reply:
      'Acme mobile launch is blocked on Stripe API keys. PROJ-101 assigned to Jane. $120K ARR at risk.',
    align: 'md:col-start-1 md:row-start-1',
  },
  {
    icon: Mail,
    title: 'Clients Desk',
    href: '/clients-desk',
    offset: 'translate-x-[8%] rotate-[1.5deg]',
    delay: '0.15s',
    preview: 'Maria asks about dashboard status…',
    reply: 'BETA-101 is in UAT. CSV export fix ships June 10. On track for June 18 delivery.',
    align: 'md:col-start-2 md:row-start-2 md:mt-16',
  },
  {
    icon: Brain,
    title: 'Brain Chat',
    href: '/brain',
    offset: 'translate-x-[-4%] rotate-[2deg]',
    delay: '0.3s',
    preview: 'Debug: hybrid RAG retrieval trace',
    reply: 'vector: 8 docs · graph: depth-2 · Groq via LiteLLM · 3 citations',
    align: 'md:col-start-3 md:row-start-1 md:mt-24',
  },
];

export function DesksShowcase() {
  const { ref, visible } = useInView(0.1);

  return (
    <section className="border-t border-white/5 bg-zinc-950 py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-[1400px] px-6 md:px-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">Workspaces</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl text-white md:text-5xl">
          Three desks. One intelligence layer.
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-6">
          {DESKS.map(({ icon: Icon, title, href, offset, delay, preview, reply, align }) => (
            <Link
              key={title}
              href={href}
              className={`desk-card group ${align} ${visible ? 'desk-card-visible' : ''}`}
              style={{ animationDelay: delay }}
            >
              <div className={`desk-card-inner ${offset}`}>
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex size-10 items-center justify-center border border-teal-500/30 bg-teal-500/10">
                    <Icon className="size-5 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>
                <div className="mt-4 space-y-3 font-mono text-xs">
                  <div className="rounded border border-zinc-800 bg-black/50 p-3 text-zinc-500">
                    {preview}
                  </div>
                  <div className="desk-card-reply rounded border border-teal-500/20 bg-teal-500/5 p-3 text-teal-100/90">
                    {reply}
                  </div>
                </div>
                <span className="mt-4 inline-block text-xs uppercase tracking-wider text-teal-500 opacity-0 transition-opacity group-hover:opacity-100">
                  Open desk →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DemoCta() {
  const { ref, visible } = useInView(0.2);

  return (
    <section id="demo" ref={ref} className="border-t border-white/5 bg-black py-24">
      <div
        className={`mx-auto max-w-xl px-6 text-center transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
      >
        <h2 className="font-display text-3xl text-white md:text-4xl">Ready for the demo?</h2>
        <p className="mt-4 text-sm text-zinc-500">
          Sign in as CEO, Client, or Admin. Role-scoped data.
        </p>
        <Link href="/auth/login" className="landing-cta mt-8 inline-flex">
          Enter Cortex →
        </Link>
      </div>
    </section>
  );
}
