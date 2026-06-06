import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC = ['/', '/auth/login', '/auth/signup', '/api/auth', '/api/brain/health'];

function isPublic(pathname: string): boolean {
  return PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? 'cortex-demo-secret-change-in-prod',
  });

  if (!token) {
    const login = new URL('/auth/login', request.url);
    login.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith('/admin') && token.role !== 'admin' && token.role !== 'ceo') {
    return NextResponse.redirect(new URL('/executive-desk', request.url));
  }

  if (pathname.startsWith('/brain') && token.role === 'client') {
    return NextResponse.redirect(new URL('/executive-desk', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
