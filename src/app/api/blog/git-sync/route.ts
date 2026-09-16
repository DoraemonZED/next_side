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
      // Check both the local state and the state after a fast-forward pull:
      // deleted files may originate from either place.
      const removedBeforePull = await blogService.cleanupMissingPostMetrics();
      const syncResult = await blogGitService.sync();
      const removedAfterPull = await blogService.cleanupMissingPostMetrics();
      const removedMetricRows = removedBeforePull + removedAfterPull;
      return {
        ...syncResult,
        removedMetricRows,
        message: removedMetricRows > 0
          ? `${syncResult.message}，已清理 ${removedMetricRows} 条失效文章数据`
          : `${syncResult.message}，文章数据校验完成`,
      };
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Blog Git sync failed:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'GitHub 同步失败' }, { status: 500 });
  }
}
