'use client';

import { needsRolePasskey } from '@cortex/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useCortexUser } from '@/hooks/use-cortex-user';

const ROLE_PUBLIC = ['/auth/continue', '/auth/login', '/auth/signup'];

/** Send members without a role passkey to /auth/continue (client-side; edge-safe). */
export function RoleGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded } = useCortexUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (ROLE_PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    if (needsRolePasskey(user.email, user.role)) {
      router.replace('/auth/continue');
    }
  }, [isLoaded, user, pathname, router]);

  return children;
}
