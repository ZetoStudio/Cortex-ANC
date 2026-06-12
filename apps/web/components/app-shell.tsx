'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Brain, LayoutDashboard, LogOut, Mail, Settings, Shield } from 'lucide-react';

import type { CortexRole } from '@cortex/auth';

import { useCortexUser } from '@/hooks/use-cortex-user';

const NAV: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: CortexRole[];
}[] = [
  { href: '/executive-desk', label: 'Executive Desk', icon: LayoutDashboard },
  { href: '/clients-desk', label: 'Clients Desk', icon: Mail },
  { href: '/brain', label: 'Brain Chat', icon: Brain, roles: ['admin', 'ceo'] },
  { href: '/admin', label: 'Admin', icon: Settings, roles: ['admin', 'ceo'] },
];

export function AppShell({
  title,
  subtitle,
  badge,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, role } = useCortexUser();

  const visibleNav = NAV.filter((item) => !item.roles || (role && item.roles.includes(role)));

  return (
    <div className="app-shell flex h-screen bg-[#0a0a0a]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-[#2a2a2a] bg-[#0f0f0f]">
        <div className="border-b border-[#2a2a2a] p-5">
          <Link href="/" className="font-display text-xl text-white">
            Cortex
          </Link>
          <p className="mt-1 text-xs text-zinc-500">Single Brain OS</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors duration-200 ${
                  active
                    ? 'border-l-2 border-[#14b8a6] bg-[#14b8a6]/10 font-medium text-[#14b8a6]'
                    : 'border-l-2 border-transparent text-zinc-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#2a2a2a] p-4">
          <div className="dark-card-inset flex items-center gap-2 px-3 py-2 text-xs">
            <Shield className="size-3.5 text-[#14b8a6]" />
            <span className="capitalize text-zinc-400">{role ?? 'guest'}</span>
          </div>
          <p className="mt-2 truncate text-xs text-zinc-600">{user?.email}</p>
          <button
            type="button"
            onClick={() =>
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    window.location.href = '/auth/login';
                  },
                },
              })
            }
            className="mt-3 flex w-full items-center gap-2 px-2 py-1.5 text-xs text-zinc-500 transition-colors duration-200 hover:text-white"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#0f0f0f] px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
          </div>
          {badge}
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        {footer && <div className="border-t border-[#2a2a2a] bg-[#0f0f0f] p-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ProjectBadge({ projectIds, role }: { projectIds: string[]; role: string | null }) {
  const label =
    role === 'client'
      ? 'BetaCorp'
      : role === 'ceo' || role === 'admin'
        ? 'All Projects'
        : projectIds.join(', ') || 'No project';

  return (
    <span className="border border-[#14b8a6]/30 bg-[#14b8a6]/10 px-3 py-1 text-xs font-medium text-[#14b8a6]">
      {label}
    </span>
  );
}
