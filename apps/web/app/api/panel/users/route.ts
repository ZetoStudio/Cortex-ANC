import { NextResponse } from 'next/server';
import { Pool } from 'pg';

import { withSuperAdminAuth } from '@/lib/super-admin-auth';

export const GET = withSuperAdminAuth(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const r = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u."tenantId" AS tenant_id, t.name AS tenant_name
       FROM "user" u
       LEFT JOIN tenants t ON t.id = u."tenantId"
       ORDER BY u.email ASC`,
    );
    return NextResponse.json({
      users: r.rows.map((row) => ({
        id: String(row.id),
        email: String(row.email),
        name: row.name ? String(row.name) : null,
        role: String(row.role ?? 'member'),
        tenantId: row.tenant_id ? String(row.tenant_id) : null,
        tenantName: row.tenant_name ? String(row.tenant_name) : null,
      })),
    });
  } finally {
    await pool.end();
  }
});
