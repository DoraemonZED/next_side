/**
 * 数据库迁移系统
 * 
 * 使用方法：
 * 1. 在 migrations 数组中添加新的迁移
 * 2. 每个迁移有唯一的版本号和名称
 * 3. 启动应用时会自动执行未执行过的迁移
 * 4. 迁移记录保存在 _migrations 表中
 */

import Database from 'better-sqlite3';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void; // 可选的回滚方法
}

// 所有迁移定义，按版本号顺序排列
export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db) => {
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
          author TEXT,
          summary TEXT,
          content_path TEXT NOT NULL,
          UNIQUE(category_slug, slug),
          FOREIGN KEY (category_slug) REFERENCES categories(slug) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS resume (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
  },
  {
    version: 2,
    name: 'add_posts_tags',
    up: (db) => {
      const columns = db.prepare("PRAGMA table_info(posts)").all() as any[];
      if (!columns.some(col => col.name === 'tags')) {
        db.exec("ALTER TABLE posts ADD COLUMN tags TEXT;");
      }
    },
  },
  {
    version: 3,
    name: 'add_posts_updated_at',
    up: (db) => {
      const columns = db.prepare("PRAGMA table_info(posts)").all() as any[];
      if (!columns.some(col => col.name === 'updated_at')) {
        db.exec("ALTER TABLE posts ADD COLUMN updated_at TEXT;");
      }
      // 为现有记录设置默认值
      db.exec("UPDATE posts SET updated_at = date WHERE updated_at IS NULL;");
    },
  },
  // ========================================
  // 在这里添加新的迁移
  // ========================================
  // {
  //   version: 4,
  //   name: 'your_migration_name',
  //   up: (db) => {
  //     // 迁移逻辑
  //   },
  // },
];

/**
 * 运行数据库迁移
 */
export function runMigrations(db: Database.Database): { 
  applied: string[]; 
  current: number;
} {
  // 创建迁移记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 获取已执行的迁移版本
  const appliedVersions = new Set(
    (db.prepare("SELECT version FROM _migrations").all() as { version: number }[])
      .map(row => row.version)
  );

  const applied: string[] = [];

  // 按版本号顺序执行未执行的迁移
  for (const migration of migrations.sort((a, b) => a.version - b.version)) {
    if (!appliedVersions.has(migration.version)) {
      try {
        console.log(`[Migration] Running: ${migration.version}_${migration.name}`);
        
        // 使用事务确保迁移原子性
        db.transaction(() => {
          migration.up(db);
          db.prepare("INSERT INTO _migrations (version, name) VALUES (?, ?)")
            .run(migration.version, migration.name);
        })();
        
        applied.push(`${migration.version}_${migration.name}`);
        console.log(`[Migration] Completed: ${migration.version}_${migration.name}`);
      } catch (error) {
        console.error(`[Migration] Failed: ${migration.version}_${migration.name}`, error);
        throw error;
      }
    }
  }

  // 获取当前版本
  const currentRow = db.prepare("SELECT MAX(version) as version FROM _migrations").get() as { version: number | null };
  const current = currentRow?.version || 0;

  if (applied.length > 0) {
    console.log(`[Migration] Applied ${applied.length} migration(s). Current version: ${current}`);
  } else {
    console.log(`[Migration] Database is up to date. Current version: ${current}`);
  }

  return { applied, current };
}

/**
 * 获取迁移状态
 */
export function getMigrationStatus(db: Database.Database): {
  current: number;
  pending: Migration[];
  applied: { version: number; name: string; applied_at: string }[];
} {
  // 确保迁移表存在
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = db.prepare("SELECT * FROM _migrations ORDER BY version").all() as {
    version: number;
    name: string;
    applied_at: string;
  }[];

  const appliedVersions = new Set(applied.map(m => m.version));
  const pending = migrations.filter(m => !appliedVersions.has(m.version));

  const currentRow = db.prepare("SELECT MAX(version) as version FROM _migrations").get() as { version: number | null };

  return {
    current: currentRow?.version || 0,
    pending,
    applied,
  };
}
