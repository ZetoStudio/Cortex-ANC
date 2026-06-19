import type { CortexRole } from './index';

const EXECUTIVE_CODE = 'Zeto';
const HR_CODE = 'Zetohr';
const EMPLOYEE_CODE = 'ZetoEmployee';

export type ExecutiveRolePick = 'ceo' | 'admin' | 'client';

export function isExecutivePasskey(code: string): boolean {
  return code.trim().toLowerCase() === EXECUTIVE_CODE.toLowerCase();
}

/** Map a role passkey to a Cortex role. Executive code requires a pick (ceo/admin/client). */
export function resolveRoleFromPasskey(
  code: string,
  executivePick?: ExecutiveRolePick,
): CortexRole | null {
  const trimmed = code.trim();
  if (!trimmed) return null;

  if (trimmed.toLowerCase() === EXECUTIVE_CODE.toLowerCase()) {
    return executivePick ?? null;
  }
  if (trimmed.toLowerCase() === HR_CODE.toLowerCase()) return 'hr';
  if (trimmed.toLowerCase() === EMPLOYEE_CODE.toLowerCase()) return 'employee';
  return null;
}

export function redirectPathForRole(role: CortexRole, employeeId: string | null): string {
  switch (role) {
    case 'super_admin':
      return '/panel';
    case 'hr':
      return '/hr';
    case 'employee':
      return employeeId ? '/employee/dashboard' : '/auth/continue?employee=missing';
    case 'client':
      return '/clients-desk';
    case 'ceo':
    case 'admin':
      return '/executive-desk';
    default:
      return '/executive-desk';
  }
}
