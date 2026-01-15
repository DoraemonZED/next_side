import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; id: string; filename: string }> }
) {
  const { category, id, filename } = await params;
  const filePath = path.join(process.cwd(), 'content/blog', category, id, filename);

  try {
    const fileBuffer = await fs.readFile(filePath);
    
    // 根据文件扩展名确定 Content-Type
    const ext = path.extname(filename).toLowerCase();
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
  } catch (error) {
    console.error('Error serving blog asset:', error);
    return new NextResponse('Asset not found', { status: 404 });
  }
}
