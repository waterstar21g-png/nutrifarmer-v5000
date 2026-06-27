import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_COOKIE_OPTS } from '@/lib/v5000-auth/config';
import { withDatabase } from '@/lib/v5000-auth/api';
import { readSessionFromCookies } from '@/lib/v5000-auth/session';
import { findUserById } from '@/lib/v5000-auth/users';

export const dynamic = 'force-dynamic';

function clearSessionResponse() {
  const res = NextResponse.json({ loggedIn: false });
  res.cookies.set(SESSION_COOKIE, '', { ...SESSION_COOKIE_OPTS, maxAge: 0 });
  return res;
}

export async function GET() {
  const session = await readSessionFromCookies();
  if (!session) {
    return NextResponse.json({ loggedIn: false });
  }

  const result = await withDatabase(async () => {
    const user = await findUserById(session.userId);
    if (!user) return clearSessionResponse();

    return NextResponse.json({
      loggedIn: true,
      user: {
        id: user.id,
        name: user.displayName,
        loginId: user.loginId,
        role: user.role,
        mustResetPassword: user.mustResetPassword,
      },
    });
  });

  if (result instanceof NextResponse) return result;
  return result;
}
