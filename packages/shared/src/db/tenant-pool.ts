import pg from 'pg';

import type { TenantContext } from '../tenant/types';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(connectionString?: string): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: connectionString ?? process.env.DATABASE_URL,
    });
  }
  return pool;
}

/** Set Postgres RLS session variable before tenant-scoped queries. */
export async function withTenantContext<T>(
  ctx: TenantContext,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [ctx.tenantId]);
    await client.query(`SELECT set_config('app.is_platform_admin', $1, true)`, [
      ctx.isPlatformAdmin ? 'true' : 'false',
    ]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function queryWithTenant<T extends pg.QueryResultRow = pg.QueryResultRow>(
  ctx: TenantContext,
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return withTenantContext(ctx, (client) => client.query<T>(text, params));
}
