import type { CortexRole } from './index';

export type RolePick = 'ceo' | 'client' | 'hr' | 'employee';

/** @deprecated use RolePick */
export type ExecutiveRolePick = 'ceo' | 'client';

/** Title-case company name so "acme" and "ACME" resolve to the same tenant. */
export function normalizeCompanyName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  return trimmed
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function companySlugFromName(name: string): string {
  return normalizeCompanyName(name)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

/** Map runtime role selection to a Cortex role (no hardcoded company codes). */
export function resolveRoleFromAssignment(
  rolePick?: RolePick | ExecutiveRolePick,
): CortexRole | null {
  if (!rolePick) return null;
  return rolePick;
}

export function redirectPathForRole(role: CortexRole, employeeId: string | null): string {
  switch (role) {
    case 'super_admin':
      return '/onboarding';
    case 'hr':
      return '/hr';
    case 'employee':
      return employeeId ? '/employee/dashboard' : '/auth/continue?employee=missing';
    case 'client':
    case 'ceo':
      return '/onboarding';
    default:
      return '/executive-desk';
  }
}
