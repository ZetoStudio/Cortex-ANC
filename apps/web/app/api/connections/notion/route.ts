import { NextResponse } from 'next/server';

import { auditAction, withAuth } from '@/lib/auth';
import '@/lib/ensure-env';
import { spawnIngestResync } from '@/lib/spawn-ingest';
import { validateNotionToken } from '@cortex/integration-core/notion';
import { queryWithTenant, saveConnectedAccount, upsertConnectorHealth } from '@cortex/shared';
import { startIngestInitialDataWorkflow } from '@cortex/shared/temporal/client';

export const POST = withAuth(
  async (_request, { user, tenant }) => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const token = process.env.NOTION_ACCESS_TOKEN?.trim();
    if (!token) {
      return NextResponse.json({ error: 'NOTION_ACCESS_TOKEN not configured' }, { status: 500 });
    }

    let workspace: string | undefined;
    try {
      const validation = await validateNotionToken(token);
      workspace = validation.workspace;
    } catch {
      return NextResponse.json({ error: 'Invalid Notion token' }, { status: 400 });
    }

    await saveConnectedAccount(tenant.tenantId, 'notion', {
      accessToken: token,
      scope: 'read',
    });

    const connectionId = `${tenant.tenantId}-notion`;
    await upsertConnectorHealth(tenant.tenantId, 'notion', 'connected', connectionId);

    const workflowId = await startIngestInitialDataWorkflow({
      tenantId: tenant.tenantId,
      providers: ['notion'],
    });

    if (!workflowId) {
      spawnIngestResync(tenant.tenantId, 'notion');
    }

    await queryWithTenant(
      tenant,
      `UPDATE tenant_onboarding SET status = 'running', step = 'ingesting', workflow_id = COALESCE($2, workflow_id), updated_at = NOW() WHERE tenant_id = $1`,
      [tenant.tenantId, workflowId ?? `direct-notion-${Date.now()}`],
    );

    await auditAction(tenant, 'connector.connected', {
      metadata: { provider: 'notion', workspace, workflowId },
    });

    return NextResponse.json({
      success: true,
      message: 'Notion connected. Ingestion started.',
      workspace,
    });
  },
  ['connector:manage'],
);
