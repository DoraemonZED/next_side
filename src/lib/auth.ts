import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-at-least-32-chars-long-!!!';
const key = new TextEncoder().encode(SECRET_KEY);

// Token 过期时间配置（小时），可通过环境变量 JWT_EXPIRES_HOURS 配置，默认 24 小时
const JWT_EXPIRES_HOURS = parseInt(process.env.JWT_EXPIRES_HOURS || '24', 10);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRES_HOURS}h`)
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  try {
    const payload = await decrypt(session);
    // 检查 token 是否过期
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

// 获取 token 过期时间（毫秒）
export function getTokenExpiresIn(): number {
  return JWT_EXPIRES_HOURS * 60 * 60 * 1000;
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  if (!session) return;

  // Refresh the session so it doesn't expire
  const parsed = await decrypt(session);
  const expires = new Date(Date.now() + getTokenExpiresIn());
  const res = new Response();
  res.headers.set('Set-Cookie', `session=${await encrypt(parsed)}; HttpOnly; Path=/; Expires=${expires.toUTCString()}`);
  return res;
}
