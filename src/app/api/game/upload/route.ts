import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { withGameLock } from '@/lib/gameLock';
import { gameService } from '@/lib/gameService';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ message: '未登录' }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ message: '请选择 ZIP 文件' }, { status: 400 });
    const content = Buffer.from(await file.arrayBuffer());
    const game = await withGameLock(() => gameService.uploadGame({
      name: String(form.get('name') || ''),
      title: String(form.get('title') || ''),
      description: String(form.get('description') || ''),
      filename: file.name,
      content,
    }));
    return NextResponse.json({ message: '游戏已上传并解压', game }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : '游戏上传失败' }, { status: 400 });
  }
}
