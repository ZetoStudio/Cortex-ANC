import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC = ['/', '/auth/login', '/auth/continue', '/auth/signup', '/sign-in', '/sign-up'];

function isPublic(pathname: string): boolean {
  return PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes use withAuth — avoid middleware fetch deadlock on /api/*
  if (pathname.startsWith('/api/')) return NextResponse.next();
  if (isPublic(pathname)) return NextResponse.next();

  const sessionRes = await fetch(new URL('/api/auth/get-session', request.url), {
    headers: {
      cookie: request.headers.get('cookie') ?? '',
    },
  });
  const session = sessionRes.ok
    ? ((await sessionRes.json()) as { user?: { tenantId?: string | null } })
    : null;

  if (!session?.user) {
    const login = new URL('/auth/login', request.url);
    login.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
