import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json(
        { message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // Create session
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await encrypt({ user: { id: user.id, username: user.username }, expires });

    // Set cookie
    (await cookies()).set('session', session, { expires, httpOnly: true, path: '/' });

    return NextResponse.json({ 
      message: '登录成功',
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
