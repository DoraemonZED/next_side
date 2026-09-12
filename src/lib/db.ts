import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'path';
import { runMigrations } from './migrations';

const dbDir = path.join(process.cwd(), 'db');
fs.mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, 'db.sqlite3');
const db = new Database(dbPath);

runMigrations(db);

// 用户表为空时只创建一次管理员。之后即使修改环境变量，也不会覆盖已有密码。
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const username = process.env.INITIAL_ADMIN_USERNAME?.trim() || 'admin';
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!password) {
    throw new Error('用户表为空，请在 .env.local 配置 INITIAL_ADMIN_PASSWORD 后再启动。');
  }
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)")
    .run(username, bcrypt.hashSync(password, 12));
  console.log(`[Database] 已创建首次管理员：${username}`);
}

export default db;
