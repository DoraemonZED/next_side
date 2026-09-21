import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { createLoginChallengeToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { sendLoginVerificationEmail } from '@/lib/backupService';

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

    const now = Date.now();
    const existingChallenge = db.prepare('SELECT sent_at FROM login_challenges WHERE user_id = ?').get(user.id) as { sent_at: number } | undefined;
    if (existingChallenge && now - existingChallenge.sent_at < 60_000) {
      return NextResponse.json({ message: '验证码已发送，请在一分钟后再试' }, { status: 429 });
    }

    const code = String(randomInt(100000, 1_000_000));
    db.prepare(`
      INSERT INTO login_challenges (user_id, code_hash, expires_at, attempts, sent_at)
      VALUES (?, ?, ?, 0, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        code_hash = excluded.code_hash,
        expires_at = excluded.expires_at,
        attempts = 0,
        sent_at = excluded.sent_at
    `).run(user.id, bcrypt.hashSync(code, 12), now + 10 * 60_000, now);

    try {
      await sendLoginVerificationEmail(code);
    } catch (error) {
      db.prepare('DELETE FROM login_challenges WHERE user_id = ?').run(user.id);
      throw error;
    }

    const challenge = await createLoginChallengeToken({ id: user.id, username: user.username });
    (await cookies()).set('login_challenge', challenge, {
      expires: new Date(now + 10 * 60_000),
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ 
      message: '验证码已发送，请前往邮箱查收',
      verificationRequired: true,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
