export type CortexRole = 'admin' | 'ceo' | 'client';

export type TenantContext = {
  tenantId: string;
  userId: string;
  email: string;
  name: string;
  role: CortexRole;
  projectIds: string[];
  isPlatformAdmin: boolean;
  correlationId?: string;
};
