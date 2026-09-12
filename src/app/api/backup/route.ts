import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createBackupArchive, sendBackupEmail } from '@/lib/backupService';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Creates one data archive and sends it to an authenticated administrator. */
export async function POST(request: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ message: '未授权' }, { status: 401 });
  }

  let archive: Awaited<ReturnType<typeof createBackupArchive>> | undefined;
  try {
    const { backupInfo, recipientEmail } = await request.json();
    if (typeof recipientEmail !== 'string' || !emailPattern.test(recipientEmail.trim())) {
      return NextResponse.json({ message: '请提供有效的接收邮箱地址' }, { status: 400 });
    }
    if (backupInfo !== undefined && typeof backupInfo !== 'string') {
      return NextResponse.json({ message: '备份说明必须是文本' }, { status: 400 });
    }

    archive = await createBackupArchive();
    await sendBackupEmail(recipientEmail.trim(), backupInfo || '', archive);
    return NextResponse.json({
      message: '备份已成功发送到您的邮箱',
      fileSize: `${(archive.sizeInBytes / 1024 / 1024).toFixed(2)} MB`,
    });
  } catch (error) {
    console.error('备份失败:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ message: `备份失败：${message}` }, { status: 500 });
  } finally {
    await archive?.cleanup();
  }
}
