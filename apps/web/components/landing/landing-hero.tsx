'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';

export function LandingHero() {
  const [typed, setTyped] = useState(0);
  const sub =
    "Connect everything. Automate workflows. Answer any question. All powered by your company's own AI.";
  const subRef = useRef(sub);

  useEffect(() => {
    subRef.current = sub;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(i);
      if (i >= sub.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [sub]);

  return (
    <section className="landing-hero relative min-h-screen overflow-hidden px-6 pt-24 pb-32 md:px-12">
      <div className="pointer-events-none absolute -left-20 top-32 size-96 rounded-full bg-teal-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-20 size-80 rounded-full bg-blue-500/10 blur-[100px]" />

      <div className="relative mx-auto max-w-[1400px]">
        <p className="animate-landing-fade font-mono text-xs uppercase tracking-[0.35em] text-zinc-500">
          AI-Native Company OS
        </p>

        <h1 className="mt-8 font-display leading-[0.85] tracking-tight text-white">
          <span className="landing-hero-line block text-[clamp(3rem,12vw,9rem)]">The Single</span>
          <span className="landing-hero-line landing-hero-accent block text-[clamp(3.5rem,14vw,10rem)]">
            Brain
          </span>
          <span className="landing-hero-line block translate-x-[8vw] text-[clamp(2.5rem,10vw,7rem)] text-zinc-400">
            for Your
          </span>
          <span className="landing-hero-line block -translate-x-[4vw] text-[clamp(3rem,11vw,8rem)]">
            Business.
          </span>
        </h1>

        <p className="mt-10 max-w-xl font-mono text-sm leading-relaxed text-zinc-400 md:text-base">
          {sub.slice(0, typed)}
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-teal-400 align-middle" />
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <a href="#demo" className="landing-cta group inline-flex items-center gap-2">
            See Cortex in Action
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
          <a
            href="#tools"
            className="rounded-none border border-zinc-700 px-6 py-3 text-sm text-zinc-300 transition-colors hover:border-teal-500/50 hover:text-white"
          >
            Explore integrations
          </a>
        </div>
      </div>

      <a
        href="#tools"
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-zinc-600 transition-colors hover:text-teal-400"
        aria-label="Scroll to tools"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest">Scroll</span>
        <ArrowDown className="size-4 animate-bounce" />
      </a>
    </section>
  );
}

export function LandingHeader() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-12">
        <Link href="/" className="font-display text-xl text-white md:text-2xl">
          Cortex
        </Link>
        <Link
          href="/auth/login"
          className="border border-zinc-700 px-4 py-2 text-xs font-medium uppercase tracking-wider text-zinc-300 transition-all hover:border-teal-500 hover:text-teal-400"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
