import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, getLoginChallenge, getTokenExpiresIn } from '@/lib/auth'
import db from '@/lib/db'

interface ChallengeRow {
  code_hash: string
  expires_at: number
  attempts: number
}

const clearChallengeCookie = async () => {
  (await cookies()).set('login_challenge', '', { expires: new Date(0), httpOnly: true, path: '/', sameSite: 'lax' })
}

/** Completes sign-in only after the password challenge's email code is verified. */
export async function POST(request: NextRequest) {
  const challenge = await getLoginChallenge()
  if (!challenge) return NextResponse.json({ message: '验证已过期，请重新登录' }, { status: 401 })

  try {
    const { code } = await request.json() as { code?: unknown }
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ message: '请输入 6 位验证码' }, { status: 400 })
    }
    const record = db.prepare('SELECT code_hash, expires_at, attempts FROM login_challenges WHERE user_id = ?').get(challenge.user.id) as ChallengeRow | undefined
    if (!record || record.expires_at < Date.now()) {
      db.prepare('DELETE FROM login_challenges WHERE user_id = ?').run(challenge.user.id)
      await clearChallengeCookie()
      return NextResponse.json({ message: '验证码已过期，请重新登录' }, { status: 400 })
    }
    if (record.attempts >= 5) {
      db.prepare('DELETE FROM login_challenges WHERE user_id = ?').run(challenge.user.id)
      await clearChallengeCookie()
      return NextResponse.json({ message: '验证尝试次数过多，请重新登录' }, { status: 429 })
    }
    if (!bcrypt.compareSync(code, record.code_hash)) {
      db.prepare('UPDATE login_challenges SET attempts = attempts + 1 WHERE user_id = ?').run(challenge.user.id)
      return NextResponse.json({ message: '验证码不正确' }, { status: 400 })
    }

    db.prepare('DELETE FROM login_challenges WHERE user_id = ?').run(challenge.user.id)
    await clearChallengeCookie()
    const user = challenge.user
    const session = await createSessionToken({ user })
    ;(await cookies()).set('session', session, {
      expires: new Date(Date.now() + getTokenExpiresIn()),
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    })
    return NextResponse.json({ message: '登录成功', user })
  } catch (error) {
    console.error('Login verification error:', error)
    return NextResponse.json({ message: '验证码验证失败，请稍后重试' }, { status: 500 })
  }
}
