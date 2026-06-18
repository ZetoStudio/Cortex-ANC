export const SUPER_ADMIN_EMAIL = 'aneeshg@zeto.studio';

export type CortexRole = 'super_admin' | 'admin' | 'ceo' | 'client' | 'hr' | 'employee' | 'member';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: CortexRole;
  tenantId: string;
  employeeId: string | null;
  projectIds: string[];
  isPlatformAdmin: boolean;
};

export function resolveRoleFromEmail(email: string, storedRole?: string | null): CortexRole {
  if (email.toLowerCase() === SUPER_ADMIN_EMAIL) return 'super_admin';
  if (storedRole) return storedRole as CortexRole;
  return 'member';
}

/** All signed-in users have full access while roles are disabled for the demo. */
export function can(user: AuthUser | null, _action: string): boolean {
  return user !== null;
}

export function canAccessPanel(role: CortexRole): boolean {
  return role === 'super_admin';
}

export function canManageWorkspace(role: CortexRole): boolean {
  return role === 'admin' || role === 'ceo' || role === 'super_admin';
}

export function canAccessHr(role: CortexRole): boolean {
  return role === 'hr' || role === 'admin' || role === 'ceo' || role === 'super_admin';
}

export function canAccessEmployeePortal(role: CortexRole): boolean {
  return role === 'employee';
}

export function sessionToAuthUser(session: {
  user: {
    id: string;
    email: string;
    name?: string | null;
    tenantId?: string | null;
    role?: string | null;
    employeeId?: string | null;
  };
}): AuthUser | null {
  const u = session.user;
  if (!u.email || !u.tenantId) return null;
  const role = resolveRoleFromEmail(u.email, u.role);
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? u.email,
    role,
    tenantId: u.tenantId,
    employeeId: u.employeeId ?? null,
    projectIds: [],
    isPlatformAdmin: role === 'super_admin' || role === 'admin',
  };
}
