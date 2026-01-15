import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; id: string; filename: string }> }
) {
  const { category, id, filename } = await params;
  
  // 这里的逻辑和之前的 API 路由一致，但它现在处理的是文章路径下的直接请求
  const filePath = path.join(process.cwd(), 'content/blog', category, id, filename);

  try {
    const fileBuffer = await fs.readFile(filePath);
    
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
    // 如果文件不存在，返回 404
    return new NextResponse('Asset not found', { status: 404 });
  }
}
