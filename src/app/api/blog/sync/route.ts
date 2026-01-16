import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { blogService } from '@/lib/blogService';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
  }

  try {
    const result = await blogService.syncBlogData();
    if (result.success) {
      return NextResponse.json({ message: result.message });
    } else {
      return NextResponse.json({ message: result.message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ message: '服务器错误' }, { status: 500 });
  }
}
