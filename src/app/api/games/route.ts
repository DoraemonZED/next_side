import { NextResponse } from 'next/server';
import { gameService } from '@/lib/gameService';

export const runtime = 'nodejs';

/** Returns the game list; an empty deployment initializes game/games.json. */
export async function GET() {
  try {
    return NextResponse.json({ games: await gameService.getGames() });
  } catch (error) {
    console.error('获取游戏列表失败:', error);
    return NextResponse.json({ message: '获取游戏列表失败' }, { status: 500 });
  }
}
