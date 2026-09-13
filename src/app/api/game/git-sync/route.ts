import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { gameGitService } from '@/lib/gameGitService';
import { withGameLock } from '@/lib/gameLock';

export const runtime = 'nodejs';

export async function POST() {
  if (!(await getSession())) return NextResponse.json({ message: '未登录' }, { status: 401 });
  try {
    return NextResponse.json(await withGameLock(() => gameGitService.sync()));
  } catch (error) {
    console.error('Game Git sync failed:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : '游戏 GitHub 同步失败' }, { status: 409 });
  }
}
