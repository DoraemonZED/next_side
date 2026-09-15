import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { safePathSegment } from '@/lib/runtimePaths';
import { blogService } from '@/lib/blogService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; id: string; filename: string }> }
) {
  const { category, id, filename } = await params;
  const safeCategory = safePathSegment(category);
  const safeId = safePathSegment(id);
  const safeFilename = safePathSegment(filename);
  if (!safeCategory || !safeId || !safeFilename) return new NextResponse('Asset not found', { status: 404 });

  const ext = path.extname(safeFilename).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    '.png': 'image/png',
    '.avif': 'image/avif',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.zip': 'application/zip',
  };
  const contentType = contentTypeMap[ext];
  if (!contentType) return new NextResponse('Asset not found', { status: 404 });

  try {
    const fileBuffer = await blogService.readAsset(safeCategory, safeId, safeFilename);
    if (!fileBuffer) return new NextResponse('Asset not found', { status: 404 });

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
