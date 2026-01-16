import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'content/db.sqlite3');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_slug TEXT NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    read_time TEXT,
    author TEXT,
    summary TEXT,
    tags TEXT,
    content_path TEXT NOT NULL,
    UNIQUE(category_slug, slug),
    FOREIGN KEY (category_slug) REFERENCES categories(slug) ON DELETE CASCADE
  );
`);

// 检查并自动补充缺失的列 (简单的迁移逻辑)
const columns = db.prepare("PRAGMA table_info(posts)").all() as any[];
const hasTags = columns.some(col => col.name === 'tags');
if (!hasTags) {
  db.exec("ALTER TABLE posts ADD COLUMN tags TEXT;");
}

export default db;
