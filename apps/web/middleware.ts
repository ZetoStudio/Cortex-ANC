import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/sign-in',
  '/sign-up',
  '/api/auth',
  '/api/brain/health',
  '/api/webhooks',
];

function isPublic(pathname: string): boolean {
  return PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const sessionRes = await fetch(new URL('/api/auth/get-session', request.url), {
    headers: {
      cookie: request.headers.get('cookie') ?? '',
    },
  });
  const session = sessionRes.ok
    ? ((await sessionRes.json()) as { user?: { role?: string } })
    : null;

  if (!session?.user) {
    const login = new URL('/auth/login', request.url);
    login.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(login);
  }

  const role = session.user.role ?? 'admin';

  if (pathname.startsWith('/admin') && role !== 'admin' && role !== 'ceo') {
    return NextResponse.redirect(new URL('/executive-desk', request.url));
  }

  if (pathname.startsWith('/brain') && role === 'client') {
    return NextResponse.redirect(new URL('/executive-desk', request.url));
  }

  if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
