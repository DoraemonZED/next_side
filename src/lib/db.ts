import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'path';
import { runDatabaseMigrations } from './dbMigration';
import { runtimeDataDirectory } from './runtimePaths';

/** Opens the persistent SQLite file shared through the db volume. */
function openDatabase(): Database.Database {
  const directory = runtimeDataDirectory('db');
  fs.mkdirSync(directory, { recursive: true });
  return new Database(path.join(directory, 'db.sqlite3'));
}

/** Creates the configured administrator exactly once, after table migrations. */
function createInitialAdminIfNeeded(db: Database.Database): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const username = process.env.INITIAL_ADMIN_USERNAME?.trim() || 'admin';
  const password = process.env.INITIAL_ADMIN_PASSWORD || '123456';
  if (!password) {
    throw new Error('用户表为空，请在 .env.local 配置 INITIAL_ADMIN_PASSWORD 后再启动。');
  }
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)")
    .run(username, bcrypt.hashSync(password, 12));
  console.log(`[Database] 已创建首次管理员：${username}`);
}

const db = openDatabase();
runDatabaseMigrations(db);
createInitialAdminIfNeeded(db);

export default db;
