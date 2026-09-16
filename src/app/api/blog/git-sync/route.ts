import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { blogGitService } from '@/lib/blogGitService';
import { blogService } from '@/lib/blogService';
import { withBlogLock } from '@/lib/blogLock';

export const runtime = 'nodejs';

export async function POST() {
  if (!(await getSession())) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
  }

  try {
    const result = await withBlogLock(async () => {
      const syncResult = await blogGitService.sync();
      const indexedPosts = await blogService.refreshPostIndex();
      return {
        ...syncResult,
        indexedPosts,
        message: `${syncResult.message}，已刷新 ${indexedPosts} 篇文章的检索索引`,
      };
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Blog Git sync failed:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'GitHub 同步失败' }, { status: 500 });
  }
}
