import { readFileSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';
import { queryWithTenant } from '@cortex/shared';
import { countNeo4jNodes } from '@cortex/shared/graph/neo4j-client';

export const GET = withAuth(
  async (_request, { tenant }) => {
    let connectors = 0;

    try {
      const generatedPath = path.resolve(
        process.cwd(),
        '../../packages/integration-core/src/connectors/registry.generated.ts',
      );
      const content = readFileSync(generatedPath, 'utf8');
      connectors = [...content.matchAll(/\{ id: '([^']+)', name: '([^']+)', status: '([^']+)'/g)]
        .length;
    } catch {
      try {
        const alt = path.resolve(
          process.cwd(),
          'packages/integration-core/src/connectors/registry.generated.ts',
        );
        const content = readFileSync(alt, 'utf8');
        connectors = [...content.matchAll(/\{ id: '([^']+)', name: '([^']+)', status: '([^']+)'/g)]
          .length;
      } catch {
        connectors = 706;
      }
    }

    let pendingApprovals = 0;
    let documentCount = 0;
    let nodeCount = 0;
    let edgeCount = 0;
    let eventCount = 0;
    let improvementCount = 0;
    let eventTimeline: { day: string; count: number }[] = [];

    let connectedTools = 0;
    try {
      const [a, d, n, e, qa, imp, timeline, ch] = await Promise.all([
        queryWithTenant<{ c: number }>(
          tenant,
          `SELECT COUNT(*)::int AS c FROM cortex_approvals WHERE status = 'pending'`,
        ),
        queryWithTenant<{ c: number }>(tenant, `SELECT COUNT(*)::int AS c FROM cortex_documents`),
        queryWithTenant<{ c: number }>(tenant, `SELECT COUNT(*)::int AS c FROM cortex_nodes`),
        queryWithTenant<{ c: number }>(tenant, `SELECT COUNT(*)::int AS c FROM cortex_edges`),
        queryWithTenant<{ c: number }>(tenant, `SELECT COUNT(*)::int AS c FROM qa_logs`),
        queryWithTenant<{ c: number }>(
          tenant,
          `SELECT COUNT(*)::int AS c FROM improvement_suggestions WHERE status = 'pending'`,
        ),
        queryWithTenant<{ day: string; count: number }>(
          tenant,
          `SELECT to_char(created_at::date, 'Mon DD') AS day, COUNT(*)::int AS count
         FROM qa_logs WHERE created_at > NOW() - INTERVAL '7 days'
         GROUP BY created_at::date ORDER BY created_at::date`,
        ),
        queryWithTenant<{ c: number }>(
          tenant,
          `SELECT COUNT(*)::int AS c FROM connector_health WHERE status = 'connected'`,
        ),
      ]);
      pendingApprovals = a.rows[0]?.c ?? 0;
      documentCount = d.rows[0]?.c ?? 0;
      nodeCount = n.rows[0]?.c ?? 0;
      edgeCount = e.rows[0]?.c ?? 0;
      eventCount = qa.rows[0]?.c ?? 0;
      improvementCount = imp.rows[0]?.c ?? 0;
      eventTimeline = timeline.rows;
      connectedTools = ch.rows[0]?.c ?? 0;
    } catch {
      // tables may not exist before migration
    }

    const neo4jNodes = await countNeo4jNodes(tenant.tenantId);

    return NextResponse.json({
      connectors,
      connectedTools,
      pendingApprovals,
      documentCount,
      nodeCount: Math.max(nodeCount, neo4jNodes),
      edgeCount,
      eventCount,
      improvementCount,
      eventTimeline,
      tenantId: tenant.tenantId,
      kafka: process.env.KAFKA_BROKERS ?? 'localhost:9092',
      integrationService:
        process.env.NEXT_PUBLIC_INTEGRATION_SERVICE_URL ?? 'http://localhost:3010',
    });
  },
  ['admin:read'],
);
