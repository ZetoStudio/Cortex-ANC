export type CortexRole = 'admin' | 'ceo' | 'client';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: CortexRole;
  tenantId: string;
  projectIds: string[];
  isPlatformAdmin: boolean;
};

/** All signed-in users have full access while roles are disabled for the demo. */
export function can(user: AuthUser | null, _action: string): boolean {
  return user !== null;
}

export function canAccessAdmin(_role: CortexRole): boolean {
  return true;
}

export function sessionToAuthUser(session: {
  user: {
    id: string;
    email: string;
    name?: string | null;
    tenantId?: string | null;
    role?: string | null;
  };
}): AuthUser | null {
  const u = session.user;
  if (!u.email || !u.tenantId) return null;
  const role = (u.role ?? 'admin') as CortexRole;
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? u.email,
    role,
    tenantId: u.tenantId,
    projectIds: [],
    isPlatformAdmin: role === 'admin',
  };
}
