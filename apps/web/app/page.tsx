import Link from 'next/link';
import { ArrowRight, Brain, Mail, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen scroll-smooth bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-2xl text-[#111111]">Cortex</span>
          <Link href="/auth/login" className="btn-primary text-sm">
            Sign in
          </Link>
        </div>
      </header>

      <section className="snap-section mx-auto max-w-6xl px-6 py-24 md:py-32">
        <p className="text-sm font-medium uppercase tracking-widest text-teal-600">
          AI-Native Company OS
        </p>
        <h1 className="font-display mt-4 max-w-3xl text-5xl leading-[1.1] tracking-tight text-[#111111] md:text-7xl">
          The Single Brain for Your Business
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
          Connect every tool. Reason across organizational knowledge. Answer in seconds with cited,
          cross-tool intelligence.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/auth/login" className="btn-primary gap-2 px-8 py-3.5">
            Try Cortex
            <ArrowRight className="size-4" />
          </Link>
          <a href="#features" className="btn-secondary px-8 py-3.5">
            Learn more
          </a>
        </div>
      </section>

      <section id="features" className="snap-section border-t border-gray-100 bg-[#fafafa] py-24">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
          {[
            {
              icon: Brain,
              title: 'Hybrid RAG Brain',
              desc: 'Vector search plus knowledge graph traversal with source citations from every tool.',
            },
            {
              icon: Sparkles,
              title: 'Executive Desk',
              desc: 'Leadership chat with role-scoped answers across Linear, Slack, GitHub, and more.',
            },
            {
              icon: Mail,
              title: 'Clients Desk',
              desc: 'AI-drafted client replies with human-in-the-loop approval before send.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <article key={title} className="paper-card animate-fade-in p-8">
              <div className="paper-card-inset mb-4 inline-flex rounded-xl p-3">
                <Icon className="size-5 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#111111]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="snap-section mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl text-[#111111] md:text-4xl">Ready for your demo?</h2>
        <p className="mx-auto mt-4 max-w-md text-gray-600">
          Sign in with admin, CEO, or client credentials to explore role-based intelligence.
        </p>
        <Link href="/auth/login" className="btn-primary mt-8 inline-flex px-8 py-3.5">
          Sign in to Cortex
        </Link>
        <p className="mt-6 font-mono text-xs text-gray-400">
          admin@cortex.anc · ceo@cortex.anc · client@cortex.anc
        </p>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        Cortex Platform · Demo build
      </footer>
    </div>
  );
}
