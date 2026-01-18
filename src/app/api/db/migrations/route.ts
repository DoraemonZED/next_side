import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import Database from 'better-sqlite3';
import path from 'path';
import { getMigrationStatus, runMigrations, migrations } from '@/lib/migrations';

// 获取迁移状态
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
  }

  try {
    const dbPath = path.join(process.cwd(), 'content/db.sqlite3');
    const db = new Database(dbPath);
    
    const status = getMigrationStatus(db);
    db.close();

    return NextResponse.json({
      current: status.current,
      total: migrations.length,
      pending: status.pending.map(m => ({ version: m.version, name: m.name })),
      applied: status.applied,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// 手动运行迁移
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
  }

  try {
    const dbPath = path.join(process.cwd(), 'content/db.sqlite3');
    const db = new Database(dbPath);
    
    const result = runMigrations(db);
    db.close();

    return NextResponse.json({
      message: result.applied.length > 0 
        ? `成功执行 ${result.applied.length} 个迁移` 
        : '数据库已是最新版本',
      applied: result.applied,
      current: result.current,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
