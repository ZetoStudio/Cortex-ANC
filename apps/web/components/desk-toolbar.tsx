'use client';

import { SyncAllButton } from '@/components/sync-all-button';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';

/** Header controls shared by Executive / Client desk. */
export function DeskToolbar() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a]/60 px-2 py-1.5">
      <WorkspaceSwitcher />
      <span className="hidden h-4 w-px bg-[#2a2a2a] sm:inline" aria-hidden />
      <SyncAllButton />
    </div>
  );
}
