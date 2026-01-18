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
    if (!category || !id) {
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

// 增加浏览量（不需要登录）
export async function PATCH(request: NextRequest) {
  try {
    const { category, id, action } = await request.json();
    
    if (!category || !id) {
      return NextResponse.json({ message: '参数缺失' }, { status: 400 });
    }

    if (action === 'view') {
      const views = await blogService.incrementViews(category, id);
      return NextResponse.json({ views });
    }

    return NextResponse.json({ message: '未知操作' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const id = searchParams.get('id');

    if (!category || !id) {
      return NextResponse.json({ message: '参数缺失' }, { status: 400 });
    }

    const success = await blogService.deletePost(category, id);
    if (success) {
      return NextResponse.json({ message: '文章删除成功' });
    } else {
      return NextResponse.json({ message: '文章删除失败' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ message: '服务器错误' }, { status: 500 });
  }
}
