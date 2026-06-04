export type CortexRole = 'owner' | 'member' | 'viewer';

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  role: CortexRole;
  organizationId?: string;
};

/** Static Permit.io-style policy map until live API is wired. */
const ROLE_PERMISSIONS: Record<CortexRole, string[]> = {
  owner: [
    'desk:read',
    'desk:write',
    'approval:decide',
    'connector:manage',
    'admin:read',
    'graph:read',
  ],
  member: ['desk:read', 'desk:write', 'approval:decide', 'graph:read'],
  viewer: ['desk:read', 'graph:read'],
};

export function can(user: AuthUser | null, action: string, _resource?: string): boolean {
  if (!user) return false;
  const perms = ROLE_PERMISSIONS[user.role] ?? [];
  return perms.includes(action);
}

export function roleFromClerkMetadata(meta?: Record<string, unknown>): CortexRole {
  const role = meta?.cortexRole ?? meta?.role;
  if (role === 'owner' || role === 'member' || role === 'viewer') return role;
  return 'member';
}

export async function getUserFromClerkId(
  clerkUserId: string,
  fetcher?: (id: string) => Promise<AuthUser | null>,
): Promise<AuthUser | null> {
  if (fetcher) return fetcher(clerkUserId);
  return {
    id: clerkUserId,
    role: 'member',
  };
}
