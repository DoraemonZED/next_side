import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { blogService, isBlogDirectoryId } from '@/lib/blogService';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
  }

  try {
    const { name, directoryId, description } = await request.json();
    if (!name || !directoryId) {
      return NextResponse.json({ message: '参数缺失' }, { status: 400 });
    }
    if (!isBlogDirectoryId(directoryId)) {
      return NextResponse.json({ message: '目录 ID 只能包含小写英文字母和连字符' }, { status: 400 });
    }

    const success = await blogService.createCategory(name, directoryId, description);
    if (success) {
      return NextResponse.json({ message: '分类创建成功' });
    } else {
      return NextResponse.json({ message: '分类创建失败' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ message: '服务器错误' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
  }

  try {
    const { categoryId, ...data } = await request.json();
    if (!categoryId) {
      return NextResponse.json({ message: '分类标识缺失' }, { status: 400 });
    }

    const success = await blogService.updateCategory(categoryId, data);
    if (success) {
      return NextResponse.json({ message: '分类更新成功' });
    } else {
      return NextResponse.json({ message: '分类更新失败' }, { status: 500 });
    }
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
    const categoryId = searchParams.get('categoryId');
    if (!categoryId) {
      return NextResponse.json({ message: '分类标识缺失' }, { status: 400 });
    }

    const success = await blogService.deleteCategory(categoryId);
    if (success) {
      return NextResponse.json({ message: '分类删除成功' });
    } else {
      return NextResponse.json({ message: '分类删除失败' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ message: '服务器错误' }, { status: 500 });
  }
}
