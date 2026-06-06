'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { CONNECTOR_TOTAL, FEATURED_TOOLS, toolLayoutSeed } from '@/lib/landing-tools';
import { useInView } from '@/hooks/use-in-view';

const DISPLAY_COUNT = 120;

export function ToolUniverse() {
  const { ref, visible } = useInView(0.08);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [revealed, setRevealed] = useState(40);

  const tools = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < DISPLAY_COUNT; i++) {
      list.push(FEATURED_TOOLS[i % FEATURED_TOOLS.length] ?? `Tool ${i}`);
    }
    return list;
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setRevealed((n) => (n >= DISPLAY_COUNT ? n : n + 4));
    }, 120);
    return () => clearInterval(id);
  }, [visible]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMouse({
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div ref={ref}>
      <section
        id="tools"
        className="relative min-h-screen border-t border-white/5 bg-black py-24 md:py-32"
      >
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-500">
                Connected
              </p>
              <h2 className="mt-3 font-display text-4xl text-white md:text-6xl">
                Everything is
                <span className="text-teal-400"> linked.</span>
              </h2>
            </div>
            <p className="font-display text-5xl text-zinc-800 md:text-7xl">
              {CONNECTOR_TOTAL}
              <span className="text-teal-500/80">+</span>
            </p>
          </div>
          <p className="mt-4 max-w-lg text-sm text-zinc-500">
            {CONNECTOR_TOTAL} integrations in the catalogue — Slack, GitHub, Linear, CRM, finance,
            AI, and more. One brain. Zero silos.
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative mx-auto mt-16 h-[70vh] max-w-[1400px] overflow-hidden px-6 md:px-12"
          style={{
            transform: `perspective(1200px) rotateX(${mouse.y * 4}deg) rotateY(${mouse.x * -4}deg)`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.08)_0%,transparent_65%)]" />
          <div className="tool-universe-grid relative h-full w-full">
            {tools.slice(0, revealed).map((name, i) => {
              const { x, y, delay, size } = toolLayoutSeed(i);
              return (
                <div
                  key={`${name}-${i}`}
                  className={`tool-chip tool-chip-${size} ${visible ? 'tool-chip-visible' : ''}`}
                  style={
                    {
                      '--tx': `${x}%`,
                      '--ty': `${y}%`,
                      '--delay': `${delay}s`,
                    } as React.CSSProperties
                  }
                  title={name}
                >
                  <span className="tool-chip-glow" />
                  <span className="relative z-10 truncate">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
