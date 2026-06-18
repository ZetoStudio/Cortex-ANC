'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: '/panel', label: 'Overview', exact: true },
  { href: '/panel/admin', label: 'Admin' },
  { href: '/panel/approvals', label: 'Employee Approvals' },
];

export function PanelSubNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-[#2a2a2a] bg-[#0f0f0f] px-4 md:px-6">
      <nav className="flex flex-wrap gap-1 py-2">
        {LINKS.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                active
                  ? 'bg-[#14b8a6]/15 font-medium text-[#14b8a6]'
                  : 'text-zinc-500 hover:bg-[#1a1a1a] hover:text-zinc-300'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
