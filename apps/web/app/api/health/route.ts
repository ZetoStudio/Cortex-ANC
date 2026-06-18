import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  let db = false;
  try {
    const url = process.env.DATABASE_URL;
    if (url) {
      const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 3000 });
      await pool.query('SELECT 1');
      await pool.end();
      db = true;
    }
  } catch {
    db = false;
  }

  return NextResponse.json({
    status: db ? 'ok' : 'degraded',
    db,
  });
}
