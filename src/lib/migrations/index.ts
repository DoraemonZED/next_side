import Database from 'better-sqlite3';

interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

// SQLite 只用于登录和简历。将来改表时，在末尾新增一个版本，已执行的版本不要修改。
const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_users_and_resume',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
];

// 每次应用进程启动时调用。已记录过的版本会跳过，所以不会重复修改数据库。
export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedVersions = new Set(
    (db.prepare('SELECT version FROM _migrations').all() as { version: number }[])
      .map(({ version }) => version),
  );

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) continue;

    db.transaction(() => {
      migration.up(db);
      db.prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)')
        .run(migration.version, migration.name);
    })();
    console.log(`[Database] 已执行迁移 ${migration.version}: ${migration.name}`);
  }
}
