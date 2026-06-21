import { NextResponse } from 'next/server';

import { githubAuthEnabled, googleAuthEnabled } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    github: githubAuthEnabled,
    google: googleAuthEnabled,
  });
}
