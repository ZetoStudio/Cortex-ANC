'use client';

import { useSession } from 'next-auth/react';

import type { CortexRole } from '@cortex/auth';

export function useCortexUser() {
  const { data: session, status } = useSession();
  const user = session?.user as
    | { email?: string; name?: string; role?: CortexRole; projectIds?: string[] }
    | undefined;

  return {
    user: user?.email
      ? {
          email: user.email,
          name: user.name ?? user.email,
          role: user.role ?? ('client' as CortexRole),
          projectIds: user.projectIds ?? [],
        }
      : null,
    role: user?.role ?? null,
    projectIds: user?.projectIds ?? [],
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
