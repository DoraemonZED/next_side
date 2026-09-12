import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const migrationsDirectory = path.join(process.cwd(), 'migrations');
const migrationFilePattern = /^(\d+)_.+\.sql$/;

function migrationFiles(): string[] {
  if (!fs.existsSync(migrationsDirectory)) {
    throw new Error(`找不到迁移目录：${migrationsDirectory}`);
  }

  const files = fs.readdirSync(migrationsDirectory)
    .filter((file) => migrationFilePattern.test(file))
    .sort((left, right) => {
      const leftVersion = Number(left.match(migrationFilePattern)?.[1]);
      const rightVersion = Number(right.match(migrationFilePattern)?.[1]);
      return leftVersion - rightVersion || left.localeCompare(right);
    });

  const versions = new Set<number>();
  for (const file of files) {
    const version = Number(file.match(migrationFilePattern)?.[1]);
    if (versions.has(version)) {
      throw new Error(`迁移版本 ${version} 有多个 SQL 文件，请保留一个。`);
    }
    versions.add(version);
  }

  return files;
}

function createMigrationTable(db: Database.Database): void {
  const columns = db.prepare("SELECT name FROM pragma_table_info('_migrations')").all() as { name: string }[];
  if (columns.length > 0 && !columns.some(({ name }) => name === 'filename')) {
    // 将旧版 version/name 记录转换为按 SQL 文件名记录的格式。
    db.exec('ALTER TABLE _migrations RENAME TO _migrations_legacy');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  if (columns.length > 0 && !columns.some(({ name }) => name === 'filename')) {
    db.exec(`
      INSERT INTO _migrations (filename, applied_at)
      SELECT printf('%03d_legacy.sql', version), applied_at FROM _migrations_legacy;
      DROP TABLE _migrations_legacy;
    `);
  }
}

// 每次应用启动时检查迁移表；只执行尚未记录的 SQL 文件。
export function runMigrations(db: Database.Database): void {
  createMigrationTable(db);
  const applied = new Set(
    (db.prepare('SELECT filename FROM _migrations').all() as { filename: string }[])
      .map(({ filename }) => filename),
  );

  for (const filename of migrationFiles()) {
    if (applied.has(filename)) continue;

    const sql = fs.readFileSync(path.join(migrationsDirectory, filename), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(filename);
    })();
    console.log(`[Database] 已执行迁移：${filename}`);
  }
}
