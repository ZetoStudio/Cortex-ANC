import { NextResponse } from 'next/server';

import { withSuperAdminAuth } from '@/lib/super-admin-auth';
import {
  getEmployeeApprovalById,
  listAllPendingApprovals,
  reviewEmployeeApproval,
  type TenantContext,
} from '@cortex/shared';

export const GET = withSuperAdminAuth(async () => {
  const approvals = await listAllPendingApprovals();
  return NextResponse.json({ approvals });
});

export const POST = withSuperAdminAuth(async (request, { user }) => {
  const body = (await request.json()) as { approvalId?: string; decision?: 'approved' | 'denied' };
  const approvalId = body.approvalId?.trim();
  const decision = body.decision;

  if (!approvalId || (decision !== 'approved' && decision !== 'denied')) {
    return NextResponse.json({ error: 'approvalId and decision are required' }, { status: 400 });
  }

  const existing = await getEmployeeApprovalById(approvalId);
  if (!existing) {
    return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
  }

  const tenant: TenantContext = {
    tenantId: existing.tenantId,
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    projectIds: user.projectIds,
    isPlatformAdmin: true,
  };

  const result = await reviewEmployeeApproval(tenant, approvalId, decision, user.id);
  return NextResponse.json(result);
});
