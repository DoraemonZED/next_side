import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameName: string }> }
) {
  const { gameName } = await params;
  
  // 构建游戏 HTML 文件路径
  const filePath = path.join(process.cwd(), 'content/game', gameName, 'index.html');

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    // 如果文件不存在，返回 404
    return new NextResponse('Game not found', { status: 404 });
  }
}
