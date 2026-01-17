import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - 获取resume数据
export async function GET() {
  try {
    const resumeData = db.prepare(`
      SELECT key, value FROM resume
    `).all() as Array<{ key: string; value: string }>;

    const result: Record<string, any> = {};
    resumeData.forEach(({ key, value }) => {
      try {
        result[key] = JSON.parse(value);
      } catch (e) {
        result[key] = value;
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching resume data:', error);
    return NextResponse.json(
      { message: '获取数据失败', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - 更新resume数据
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: '未授权' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // 验证数据格式
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { message: '无效的数据格式' },
        { status: 400 }
      );
    }

    // 更新每个key的数据
    const updateStmt = db.prepare(`
      INSERT INTO resume (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `);

    for (const [key, value] of Object.entries(data)) {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      updateStmt.run(key, jsonValue);
    }

    return NextResponse.json({ message: '更新成功' });
  } catch (error: any) {
    console.error('Error updating resume data:', error);
    return NextResponse.json(
      { message: '更新失败', error: error.message },
      { status: 500 }
    );
  }
}
