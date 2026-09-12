import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { runtimeDataDirectory, safePathSegment } from '@/lib/runtimePaths';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; id: string; filename: string }> }
) {
  const { category, id, filename } = await params;
  const safeCategory = safePathSegment(category);
  const safeId = safePathSegment(id);
  const safeFilename = safePathSegment(filename);
  if (!safeCategory || !safeId || !safeFilename) return new NextResponse('Asset not found', { status: 404 });
  
  const filePath = path.join(runtimeDataDirectory('blog'), safeCategory, safeId, safeFilename);

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
