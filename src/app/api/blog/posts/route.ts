import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { blogService } from '@/lib/blogService';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
  }

  try {
    const { category, id, meta, content } = await request.json();
    if (!category || !id || content === undefined) {
      return NextResponse.json({ message: '参数缺失' }, { status: 400 });
    }

    const success = await blogService.savePost(category, id, meta || {}, content);
    if (success) {
      return NextResponse.json({ message: '文章保存成功' });
    } else {
      return NextResponse.json({ message: '文章保存失败' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ message: '服务器错误' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
