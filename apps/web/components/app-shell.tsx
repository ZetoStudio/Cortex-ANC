'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
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
    <div className="flex h-screen bg-[#fafafa]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <Link href="/" className="font-display text-xl text-[#111111]">
            Cortex
          </Link>
          <p className="mt-1 text-xs text-gray-500">Single Brain OS</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-teal-50 font-medium text-teal-800'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#111111]'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 p-4">
          <div className="paper-card-inset flex items-center gap-2 px-3 py-2 text-xs">
            <Shield className="size-3.5 text-teal-600" />
            <span className="capitalize text-gray-600">{role ?? 'guest'}</span>
          </div>
          <p className="mt-2 truncate text-xs text-gray-500">{user?.email}</p>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-50 hover:text-[#111111]"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#111111]">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {badge}
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        {footer && <div className="border-t border-gray-200 bg-white p-4">{footer}</div>}
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
    <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
      {label}
    </span>
  );
}
