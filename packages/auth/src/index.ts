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

const ROLE_PERMISSIONS: Record<CortexRole, string[]> = {
  admin: [
    'desk:read',
    'desk:write',
    'approval:decide',
    'connector:manage',
    'admin:read',
    'graph:read',
    'brain:debug',
  ],
  ceo: ['desk:read', 'desk:write', 'approval:decide', 'admin:read', 'graph:read', 'brain:debug'],
  client: ['desk:read', 'desk:write', 'graph:read'],
};

export function can(user: AuthUser | null, action: string): boolean {
  if (!user) return false;
  return (ROLE_PERMISSIONS[user.role] ?? []).includes(action);
}

export function canAccessAdmin(role: CortexRole): boolean {
  return role === 'admin' || role === 'ceo';
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
