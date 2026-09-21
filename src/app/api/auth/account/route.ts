import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, getSession, getTokenExpiresIn } from '@/lib/auth'
import db from '@/lib/db'

interface UserRow {
  id: number
  username: string
  password: string
}

const usernamePattern = /^[A-Za-z0-9._-]{3,32}$/

async function refreshSession(user: { id: number; username: string }) {
  const expires = new Date(Date.now() + getTokenExpiresIn())
  const session = await createSessionToken({ user })
  ;(await cookies()).set('session', session, {
    expires,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  })
}

/** Updates the signed-in account after verifying the current password. */
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: '登录已过期，请重新登录' }, { status: 401 })

  try {
    const body = await request.json() as { action?: unknown; currentPassword?: unknown; username?: unknown; newPassword?: unknown }
    const { action, currentPassword } = body
    if (typeof currentPassword !== 'string' || !currentPassword) {
      return NextResponse.json({ message: '请输入当前密码' }, { status: 400 })
    }

    const user = db.prepare('SELECT id, username, password FROM users WHERE id = ?').get(session.user.id) as UserRow | undefined
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
      return NextResponse.json({ message: '当前密码不正确' }, { status: 400 })
    }

    if (action === 'username') {
      const username = typeof body.username === 'string' ? body.username.trim() : ''
      if (!usernamePattern.test(username)) {
        return NextResponse.json({ message: '用户名须为 3–32 位字母、数字、点、横线或下划线' }, { status: 400 })
      }
      const duplicate = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, user.id)
      if (duplicate) return NextResponse.json({ message: '该用户名已被使用' }, { status: 409 })

      db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, user.id)
      const updatedUser = { id: user.id, username }
      await refreshSession(updatedUser)
      return NextResponse.json({ message: '用户名已更新', user: updatedUser })
    }

    if (action === 'password') {
      const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
      if (newPassword.length < 8 || newPassword.length > 128) {
        return NextResponse.json({ message: '新密码长度须为 8–128 位' }, { status: 400 })
      }
      if (bcrypt.compareSync(newPassword, user.password)) {
        return NextResponse.json({ message: '新密码不能与当前密码相同' }, { status: 400 })
      }
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 12), user.id)
      await refreshSession({ id: user.id, username: user.username })
      return NextResponse.json({ message: '密码已更新' })
    }

    return NextResponse.json({ message: '不支持的账户操作' }, { status: 400 })
  } catch (error) {
    console.error('Account update error:', error)
    return NextResponse.json({ message: '账户更新失败，请稍后重试' }, { status: 500 })
  }
}
