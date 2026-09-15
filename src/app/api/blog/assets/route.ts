import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { blogService } from '@/lib/blogService';

const failure = (error: unknown) => NextResponse.json({ message: error instanceof Error ? error.message : '文件操作失败' }, { status: 400 });

async function requireSession() {
  if (!await getSession()) return NextResponse.json({ message: '未登录' }, { status: 401 });
  return null;
}

export async function GET(request: NextRequest) {
  const unauthenticated = await requireSession();
  if (unauthenticated) return unauthenticated;
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const id = searchParams.get('id');
  if (!category || !id) return NextResponse.json({ message: '参数缺失' }, { status: 400 });
  try { return NextResponse.json({ assets: await blogService.listAssets(category, id) }); } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  const unauthenticated = await requireSession();
  if (unauthenticated) return unauthenticated;
  try {
    const form = await request.formData();
    const category = form.get('category'), id = form.get('id'), file = form.get('file');
    if (typeof category !== 'string' || typeof id !== 'string' || !(file instanceof File)) return NextResponse.json({ message: '参数缺失' }, { status: 400 });
    await blogService.addAsset(category, id, file.name, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ message: '文件上传成功' });
  } catch (error) { return failure(error); }
}

export async function PATCH(request: NextRequest) {
  const unauthenticated = await requireSession();
  if (unauthenticated) return unauthenticated;
  try {
    const { category, id, name, nextName } = await request.json();
    if (!category || !id || !name || !nextName) return NextResponse.json({ message: '参数缺失' }, { status: 400 });
    await blogService.renameAsset(category, id, name, nextName);
    return NextResponse.json({ message: '文件已重命名' });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: NextRequest) {
  const unauthenticated = await requireSession();
  if (unauthenticated) return unauthenticated;
  try {
    const { category, id, name } = await request.json();
    if (!category || !id || !name) return NextResponse.json({ message: '参数缺失' }, { status: 400 });
    await blogService.deleteAsset(category, id, name);
    return NextResponse.json({ message: '文件已删除' });
  } catch (error) { return failure(error); }
}
