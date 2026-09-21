import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'path';
import { runDatabaseMigrations } from './dbMigration';
import { runtimeDataDirectory } from './runtimePaths';
import { initialAdminPassword, initialAdminUsername, initialResumeData } from './initData';

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

  const username = initialAdminUsername;
  const password = initialAdminPassword;
  if (!password) {
    throw new Error('用户表为空，请在 .env.local 配置 INITIAL_ADMIN_PASSWORD 后再启动。');
  }
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)")
    .run(username, bcrypt.hashSync(password, 12));
  console.log(`[Database] 已创建首次管理员：${username}`);
}

/** Seeds the editable resume record once, alongside the initial administrator. */
function createInitialResumeContentIfNeeded(db: Database.Database): void {
  const existing = db.prepare('SELECT id FROM resume_content WHERE id = 1').get();
  if (existing) return;

  db.prepare('INSERT INTO resume_content (id, content) VALUES (1, ?)')
    .run(JSON.stringify(initialResumeData));
  console.log('[Database] 已写入初始简历内容');
}

const db = openDatabase();
runDatabaseMigrations(db);
createInitialAdminIfNeeded(db);
createInitialResumeContentIfNeeded(db);

export default db;
