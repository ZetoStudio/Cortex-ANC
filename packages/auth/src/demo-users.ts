export type DemoRole = 'admin' | 'ceo' | 'client';

export type DemoUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: DemoRole;
  projectIds: string[];
};

/** Demo credentials for team presentations. */
export const DEMO_USERS: DemoUser[] = [
  {
    id: 'user-admin',
    email: 'admin@cortex.anc',
    password: 'password',
    name: 'Admin User',
    role: 'admin',
    projectIds: ['acme', 'global-dynamics', 'betacorp'],
  },
  {
    id: 'user-ceo',
    email: 'ceo@cortex.anc',
    password: 'password',
    name: 'CEO User',
    role: 'ceo',
    projectIds: ['acme', 'global-dynamics'],
  },
  {
    id: 'user-client',
    email: 'client@cortex.anc',
    password: 'password',
    name: 'BetaCorp Client',
    role: 'client',
    projectIds: ['betacorp'],
  },
];

export function findDemoUser(email: string, password: string): DemoUser | null {
  const user = DEMO_USERS.find((u) => u.email === email && u.password === password);
  return user ?? null;
}

export function projectIdsForRole(role: DemoRole): string[] {
  const user = DEMO_USERS.find((u) => u.role === role);
  return user?.projectIds ?? [];
}

export function canAccessAdmin(role: DemoRole): boolean {
  return role === 'admin' || role === 'ceo';
}
