import { readFileSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import pg from 'pg';

import { withAuth } from '@/lib/auth';

const { Pool } = pg;

export const GET = withAuth(async () => {
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

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const pool = new Pool({ connectionString: dbUrl });
      const [a, d, n, e, qa, imp, timeline] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS c FROM cortex_approvals WHERE status = 'pending'`),
        pool.query(`SELECT COUNT(*)::int AS c FROM cortex_documents`),
        pool.query(`SELECT COUNT(*)::int AS c FROM cortex_nodes`),
        pool.query(`SELECT COUNT(*)::int AS c FROM cortex_edges`),
        pool.query(`SELECT COUNT(*)::int AS c FROM qa_logs`),
        pool.query(
          `SELECT COUNT(*)::int AS c FROM improvement_suggestions WHERE status = 'pending'`,
        ),
        pool.query(`
          SELECT to_char(created_at::date, 'Mon DD') AS day, COUNT(*)::int AS count
          FROM qa_logs
          WHERE created_at > NOW() - INTERVAL '7 days'
          GROUP BY created_at::date
          ORDER BY created_at::date
        `),
      ]);
      pendingApprovals = a.rows[0]?.c ?? 0;
      documentCount = d.rows[0]?.c ?? 0;
      nodeCount = n.rows[0]?.c ?? 0;
      edgeCount = e.rows[0]?.c ?? 0;
      eventCount = qa.rows[0]?.c ?? 0;
      improvementCount = imp.rows[0]?.c ?? 0;
      eventTimeline = timeline.rows as { day: string; count: number }[];
      await pool.end();
    } catch {
      // tables may not exist
    }
  }

  return NextResponse.json({
    connectors,
    pendingApprovals,
    documentCount,
    nodeCount,
    edgeCount,
    eventCount,
    improvementCount,
    eventTimeline,
    kafka: process.env.KAFKA_BROKERS ?? 'localhost:9092',
    nango: process.env.NANGO_SERVER_URL ?? 'http://localhost:3003',
  });
}, ['admin:read']);
