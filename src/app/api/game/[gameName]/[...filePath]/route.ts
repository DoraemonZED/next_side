import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runtimeDataDirectory, safePathSegment } from '@/lib/runtimePaths';

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.wasm': 'application/wasm',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

export async function GET(_request: Request, { params }: { params: Promise<{ gameName: string; filePath: string[] }> }) {
  const { gameName, filePath } = await params;
  const safeGameName = safePathSegment(gameName);
  const safeParts = filePath.map(safePathSegment);
  if (!safeGameName || safeParts.some((part) => !part)) return new NextResponse('Game asset not found', { status: 404 });
  const root = path.resolve(runtimeDataDirectory('game'), safeGameName);
  const filePathOnDisk = path.resolve(root, ...(safeParts as string[]));
  if (!filePathOnDisk.startsWith(`${root}${path.sep}`)) return new NextResponse('Game asset not found', { status: 404 });
  try {
    const file = await fs.readFile(filePathOnDisk);
    return new NextResponse(file, {
      headers: {
        'Content-Type': MIME_TYPES[path.extname(filePathOnDisk).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse('Game asset not found', { status: 404 });
  }
}
