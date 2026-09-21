import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-at-least-32-chars-long-!!!';
const key = new TextEncoder().encode(SECRET_KEY);

const JWT_EXPIRES_HOURS = parseInt(process.env.JWT_EXPIRES_HOURS || '24', 10);

export interface SessionPayload extends JWTPayload {
  user: { id: number; username: string };
}

interface LoginChallengePayload extends JWTPayload {
  user: { id: number; username: string };
  purpose: 'login-challenge';
}

/** Creates the signed HTTP-only session value stored in the browser cookie. */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRES_HOURS}h`)
    .sign(key);
}

/** Creates a short-lived signed marker used between password and email-code verification. */
export async function createLoginChallengeToken(user: SessionPayload['user']): Promise<string> {
  return new SignJWT({ user, purpose: 'login-challenge' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(key);
}

async function verifySessionToken(input: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  if (!payload.user || typeof payload.user !== 'object') throw new Error('会话中缺少用户信息');

  const user = payload.user as { id?: unknown; username?: unknown };
  if (typeof user.id !== 'number' || typeof user.username !== 'string') {
    throw new Error('会话中的用户信息无效');
  }
  return payload as SessionPayload;
}

/** Returns the verified session for server components and route handlers. */
export async function getSession(): Promise<SessionPayload | null> {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  try {
    return await verifySessionToken(session);
  } catch {
    return null;
  }
}

/** Returns the pending, short-lived login challenge if it is valid. */
export async function getLoginChallenge(): Promise<LoginChallengePayload | null> {
  const challenge = (await cookies()).get('login_challenge')?.value;
  if (!challenge) return null;
  try {
    const { payload } = await jwtVerify(challenge, key, { algorithms: ['HS256'] });
    if (payload.purpose !== 'login-challenge' || !payload.user || typeof payload.user !== 'object') return null;
    const user = payload.user as { id?: unknown; username?: unknown };
    if (typeof user.id !== 'number' || typeof user.username !== 'string') return null;
    return payload as LoginChallengePayload;
  } catch {
    return null;
  }
}

/** Session lifetime in milliseconds; used to set the browser cookie expiry. */
export function getTokenExpiresIn(): number {
  return JWT_EXPIRES_HOURS * 60 * 60 * 1000;
}
