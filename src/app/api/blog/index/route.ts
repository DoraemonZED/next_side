import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { blogService } from '@/lib/blogService';
import { withBlogLock } from '@/lib/blogLock';

export const runtime = 'nodejs';

/** Rebuilds the SQLite list index from the Markdown source files on demand. */
export async function POST() {
  if (!(await getSession())) return NextResponse.json({ message: '未登录' }, { status: 401 });
  try {
    const indexedPosts = await withBlogLock(() => blogService.refreshPostIndex());
    return NextResponse.json({ message: `已重建 ${indexedPosts} 篇文章的检索索引`, indexedPosts });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : '重建文章索引失败' }, { status: 500 });
  }
}
