import AdmZip from 'adm-zip';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { blogService, isBlogDirectoryId } from '@/lib/blogService';

export const runtime = 'nodejs';

const MAX_ZIP_ENTRIES = 500;
const MAX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: '未登录' }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.zip')) return NextResponse.json({ message: '请选择 ZIP 文件' }, { status: 400 });
    if (file.size > 30 * 1024 * 1024) return NextResponse.json({ message: 'ZIP 文件不能超过 30 MB' }, { status: 400 });
    const entries = new AdmZip(Buffer.from(await file.arrayBuffer())).getEntries().filter((entry) => !entry.isDirectory && !entry.entryName.startsWith('__MACOSX/') && !entry.entryName.endsWith('.DS_Store'));
    if (!entries.length) return NextResponse.json({ message: 'ZIP 内没有可导入文件' }, { status: 400 });
    if (entries.length > MAX_ZIP_ENTRIES) return NextResponse.json({ message: `ZIP 最多包含 ${MAX_ZIP_ENTRIES} 个文件` }, { status: 400 });
    const uncompressedSize = entries.reduce((total, entry) => total + entry.header.size, 0);
    if (uncompressedSize > MAX_UNCOMPRESSED_SIZE) return NextResponse.json({ message: 'ZIP 解压后的总大小不能超过 100 MB' }, { status: 400 });
    const files = entries.map((entry) => ({ path: entry.entryName.replace(/^\/+/, ''), data: entry.getData() }));
    if (new Set(files.map((item) => item.path)).size !== files.length) return NextResponse.json({ message: 'ZIP 中包含重复文件路径' }, { status: 400 });
    const roots = [...new Set(files.map((file) => file.path.split('/')[0]))];
    if (roots.length !== 1 || !isBlogDirectoryId(roots[0]) || files.some((file) => { const p = file.path.split('/'); return p.length !== 3 || !isBlogDirectoryId(p[1]) || p.includes('..') || p.some((part) => !part); })) {
      return NextResponse.json({ message: 'ZIP 必须为“分类目录/文章目录 ID/文件”的单一分类结构，目录 ID 只能使用小写英文和连字符' }, { status: 400 });
    }
    const postIds = [...new Set(files.map((file) => file.path.split('/')[1]))];
    if (postIds.some((postId) => !files.some((file) => file.path === `${roots[0]}/${postId}/index.md`))) return NextResponse.json({ message: '每个文章目录必须包含 index.md' }, { status: 400 });
    const result = await blogService.importZip(roots[0], files);
    return NextResponse.json({ message: `已导入 ${result.posts} 篇文章，已补全 Markdown 元数据并初始化文章指标`, ...result });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : '上传失败' }, { status: 500 });
  }
}
