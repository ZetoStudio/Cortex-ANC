import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';
import { normalizeOAuthProvider } from '@cortex/shared';

/** Legacy redirect — prefer /api/auth/connect/[provider]. */
export const GET = withAuth(
  async (request) => {
    const url = new URL(request.url);
    const raw = url.searchParams.get('provider') ?? 'google-workspace';
    const provider = normalizeOAuthProvider(raw) ?? 'google';
    const returnUrl = url.searchParams.get('return_url');
    const target = new URL(
      `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/auth/connect/${provider}`,
    );
    if (returnUrl) target.searchParams.set('return_url', returnUrl);
    return NextResponse.redirect(target.toString());
  },
  ['connector:manage'],
);
