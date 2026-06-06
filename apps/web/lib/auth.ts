import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { can, type AuthUser, type CortexRole } from '@cortex/auth';

import { authOptions } from './auth-options';

export type CortexSessionUser = AuthUser;

export async function getSessionUser(): Promise<CortexSessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const u = session.user as {
    email: string;
    name?: string | null;
    role?: CortexRole;
    projectIds?: string[];
  };
  return {
    id: (session.user as { id?: string }).id ?? u.email,
    email: u.email,
    name: u.name ?? u.email,
    role: u.role ?? 'client',
    projectIds: u.projectIds ?? [],
  };
}

type RouteHandler = (
  request: Request,
  context: { user: CortexSessionUser },
) => Promise<Response> | Response;

export function withAuth(handler: RouteHandler, requiredActions?: string[]) {
  return async (request: Request): Promise<Response> => {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (requiredActions?.length) {
      const allowed = requiredActions.some((action) => can(user, action));
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    return handler(request, { user });
  };
}
