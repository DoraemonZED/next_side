import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createDatabaseBackup, sendDatabaseEmail } from '@/lib/backupService';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sends the persistent SQLite database file to an authenticated administrator. */
export async function POST(request: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ message: '未授权' }, { status: 401 });
  }

  try {
    const { recipientEmail } = await request.json();
    if (typeof recipientEmail !== 'string' || !emailPattern.test(recipientEmail.trim())) {
      return NextResponse.json({ message: '请提供有效的接收邮箱地址' }, { status: 400 });
    }

    const backup = await createDatabaseBackup();
    await sendDatabaseEmail(recipientEmail.trim(), backup);
    return NextResponse.json({
      message: '数据库文件已成功发送到您的邮箱',
      fileSize: `${(backup.sizeInBytes / 1024 / 1024).toFixed(2)} MB`,
    });
  } catch (error) {
    console.error('备份失败:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ message: `备份失败：${message}` }, { status: 500 });
  }
}
