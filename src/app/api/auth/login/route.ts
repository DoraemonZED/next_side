import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSessionToken, getTokenExpiresIn } from '@/lib/auth';
import { cookies } from 'next/headers';

interface UserRow {
  id: number;
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ message: '用户名和密码不能为空' }, { status: 400 });
    }

    const user = db.prepare('SELECT id, username, password FROM users WHERE username = ?').get(username) as UserRow | undefined;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json(
        { message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    const expiresIn = getTokenExpiresIn();
    const expires = new Date(Date.now() + expiresIn);
    const session = await createSessionToken({ user: { id: user.id, username: user.username } });

    (await cookies()).set('session', session, {
      expires,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });

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
