'use client';

import { SyncAllButton } from '@/components/sync-all-button';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';

/** Header controls shared by Executive / Client desk. */
export function DeskToolbar() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <WorkspaceSwitcher />
      <SyncAllButton />
    </div>
  );
}
