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
  { params }: { params: Promise<{ category: string; id: string; filename: string }> }
) {
  const { category, id, filename } = await params;
  const safeCategory = safeSegment(category);
  const safeId = safeSegment(id);
  const safeFilename = safeSegment(filename);
  if (!safeCategory || !safeId || !safeFilename) return new NextResponse('Asset not found', { status: 404 });
  
  // 这里的逻辑和之前的 API 路由一致，但它现在处理的是文章路径下的直接请求
  const filePath = path.join(process.cwd(), 'blog', safeCategory, safeId, safeFilename);

  try {
    const fileBuffer = await fs.readFile(filePath);
    
    const ext = path.extname(safeFilename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
    };
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    // 如果文件不存在，返回 404
    return new NextResponse('Asset not found', { status: 404 });
  }
}
