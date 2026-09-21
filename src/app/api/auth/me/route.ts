import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSessionToken, getSession, getTokenExpiresIn } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  
  // Every authenticated activity check extends the expiry window. The token itself
  // remains HTTP-only and is never exposed to client-side storage.
  const expires = new Date(Date.now() + getTokenExpiresIn());
  const refreshedToken = await createSessionToken({ user: session.user });
  (await cookies()).set('session', refreshedToken, {
    expires,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  });
  
  return NextResponse.json({ 
    authenticated: true, 
    user: session.user,
    expiresAt: expires.toISOString(),
    expiresIn: Math.floor(getTokenExpiresIn() / 1000),
  });
}
