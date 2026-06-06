import type { DemoRole } from './demo-users';

export {
  DEMO_USERS,
  findDemoUser,
  getDemoUserByRole,
  projectIdsForRole,
  canAccessAdmin,
  type DemoRole,
  type DemoUser,
} from './demo-users';

export type CortexRole = DemoRole;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: CortexRole;
  projectIds: string[];
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

export function toAuthUser(demo: {
  id: string;
  email: string;
  name: string;
  role: CortexRole;
  projectIds: string[];
}): AuthUser {
  return demo;
}
