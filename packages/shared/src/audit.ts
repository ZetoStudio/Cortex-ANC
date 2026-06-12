import type { TenantContext } from './tenant/types';
import { queryWithTenant } from './db/tenant-pool';

export type AuditEventType =
  | 'auth.login'
  | 'auth.signup'
  | 'connector.connected'
  | 'connector.sync'
  | 'ingestion.started'
  | 'ingestion.completed'
  | 'onboarding.started'
  | 'brain.query'
  | 'approval.decided';

export async function auditFromContext(
  ctx: TenantContext,
  eventType: AuditEventType,
  extra?: { metadata?: Record<string, unknown> },
): Promise<void> {
  await queryWithTenant(
    ctx,
    `INSERT INTO audit_logs (id, tenant_id, user_id, event_type, metadata)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4)`,
    [ctx.tenantId, ctx.userId, eventType, JSON.stringify(extra?.metadata ?? {})],
  );
}
