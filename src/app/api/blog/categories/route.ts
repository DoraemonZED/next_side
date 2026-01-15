import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { blogService } from '@/lib/blogService';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
  }

  try {
    const { slug, name, description } = await request.json();
    if (!slug || !name) {
      return NextResponse.json({ message: '参数缺失' }, { status: 400 });
    }

    const success = await blogService.createCategory(slug, name, description);
    if (success) {
      return NextResponse.json({ message: '分类创建成功' });
    } else {
      return NextResponse.json({ message: '分类创建失败' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ message: '服务器错误' }, { status: 500 });
  }
}
