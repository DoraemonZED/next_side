import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { blogService, isBlogDirectoryId } from '@/lib/blogService';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
  }

  try {
    const { category, id, meta, content, directoryId } = await request.json();
    if (!category || !id) {
      return NextResponse.json({ message: '参数缺失' }, { status: 400 });
    }

    if (directoryId !== undefined && !isBlogDirectoryId(directoryId)) {
      return NextResponse.json({ message: '目录 ID 只能包含小写英文字母和连字符' }, { status: 400 });
    }
    const success = await blogService.savePost(category, id, meta || {}, content, directoryId);
    if (success) {
      return NextResponse.json({ message: '文章保存成功' });
    } else {
      return NextResponse.json({ message: '文章保存失败' }, { status: 500 });
    }
  } catch {
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

    if (action === 'like') {
      const likes = await blogService.incrementLikes(category, id);
      return NextResponse.json({ likes });
    }

    if (action === 'share') {
      const shares = await blogService.incrementShares(category, id);
      return NextResponse.json({ shares });
    }

    return NextResponse.json({ message: '未知操作' }, { status: 400 });
  } catch {
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
  } catch {
    return NextResponse.json({ message: '服务器错误' }, { status: 500 });
  }
}
