import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function safeSegment(value: string): string | null {
  const normalized = value.trim();
  return normalized && normalized !== '.' && normalized !== '..' && !normalized.includes('/') && !normalized.includes('\\') && !normalized.includes('\0')
    ? normalized
    : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameName: string }> }
) {
  const { gameName } = await params;
  const safeGameName = safeSegment(gameName);
  if (!safeGameName) return new NextResponse('Game not found', { status: 404 });
  
  // 构建游戏 HTML 文件路径
  const filePath = path.join(process.cwd(), 'game', safeGameName, 'index.html');

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    // 如果文件不存在，返回 404
    return new NextResponse('Game not found', { status: 404 });
  }
}
