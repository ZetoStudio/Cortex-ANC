'use client';

import Link from 'next/link';

import { AppShell, ProjectBadge } from '@/components/app-shell';
import { PanelSubNav } from '@/components/panel/panel-sub-nav';
import { useCortexUser } from '@/hooks/use-cortex-user';
import { canAccessPanel } from '@cortex/auth';

export function PanelLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, tenantId, isLoaded } = useCortexUser();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-zinc-500">
        Loading panel…
      </div>
    );
  }

  if (!user || !canAccessPanel(user.role)) {
    return (
      <AppShell title="Panel" subtitle="Restricted" badge={<ProjectBadge tenantId={tenantId} />}>
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-zinc-400">Super admin access required.</p>
          <Link href="/executive-desk" className="text-sm text-[#14b8a6] hover:underline">
            Back to Executive Desk
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Panel"
      subtitle="Command center — platform health and operations"
      badge={<ProjectBadge tenantId={tenantId} />}
    >
      <div className="flex h-full min-h-0 flex-col">
        <PanelSubNav />
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </AppShell>
  );
}
