import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { runtimeDataDirectory, safePathSegment } from '@/lib/runtimePaths';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameName: string }> }
) {
  const { gameName } = await params;
  const safeGameName = safePathSegment(gameName);
  if (!safeGameName) return new NextResponse('Game not found', { status: 404 });
  
  const filePath = path.join(runtimeDataDirectory('game'), safeGameName, 'index.html');

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
