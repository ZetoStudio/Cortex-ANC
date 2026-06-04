import { CONNECTOR_COUNT, CORE_CONNECTORS } from '@/lib/catalog';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    connectors: CORE_CONNECTORS,
    count: CONNECTOR_COUNT,
  });
}
