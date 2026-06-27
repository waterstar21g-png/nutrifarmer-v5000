import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/v5000-auth/config';
import { sessionPayloadLooksValid } from '@/lib/session-edge';

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/write')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionPayloadLooksValid(token)) {
    const login = new URL('/login', request.url);
    login.searchParams.set('redirect_to', '/write');
    const res = NextResponse.redirect(login);
    if (token) {
      res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0, sameSite: 'lax' });
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/write', '/write/:path*'],
};
