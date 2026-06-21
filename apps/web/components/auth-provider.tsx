'use client';

import { RoleGate } from '@/components/role-gate';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <RoleGate>{children}</RoleGate>;
}
