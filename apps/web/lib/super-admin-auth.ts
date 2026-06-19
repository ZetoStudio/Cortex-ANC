import { NextResponse } from 'next/server';

import { canAccessPlatformAdmin } from '@cortex/auth';

import { withAuth } from './auth';

type SuperAdminHandler = (
  request: Request,
  context: Parameters<Parameters<typeof withAuth>[0]>[1],
) => Promise<Response> | Response;

export function withSuperAdminAuth(handler: SuperAdminHandler) {
  return withAuth(async (request, context) => {
    if (!canAccessPlatformAdmin(context.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return handler(request, context);
  });
}
