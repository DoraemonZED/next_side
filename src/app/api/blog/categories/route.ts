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

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
  }

  try {
    const { slug, ...data } = await request.json();
    if (!slug) {
      return NextResponse.json({ message: '分类标识缺失' }, { status: 400 });
    }

    const success = await blogService.updateCategory(slug, data);
    if (success) {
      return NextResponse.json({ message: '分类更新成功' });
    } else {
      return NextResponse.json({ message: '分类更新失败' }, { status: 500 });
    }
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
    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ message: '分类标识缺失' }, { status: 400 });
    }

    const success = await blogService.deleteCategory(slug);
    if (success) {
      return NextResponse.json({ message: '分类删除成功' });
    } else {
      return NextResponse.json({ message: '分类删除失败' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ message: '服务器错误' }, { status: 500 });
  }
}
