import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { withGameLock } from '@/lib/gameLock';
import { gameService } from '@/lib/gameService';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: '未登录' }, { status: 401 });
  try {
    const name = request.nextUrl.searchParams.get('name') || '';
    await withGameLock(() => gameService.deleteGame(name));
    return NextResponse.json({ message: '游戏及其 ZIP 包已删除' });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : '删除游戏失败' }, { status: 400 });
  }
}
