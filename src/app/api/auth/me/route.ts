import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  
  // 返回用户信息和 token 过期时间
  const expiresAt = session.exp ? new Date(session.exp * 1000).toISOString() : null;
  const expiresIn = session.exp ? Math.max(0, Math.floor((session.exp * 1000 - Date.now()) / 1000)) : null;
  
  return NextResponse.json({ 
    authenticated: true, 
    user: session.user,
    expiresAt,
    expiresIn, // 剩余秒数
  });
}
