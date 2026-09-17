import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const migrationsDirectory = path.join(process.cwd(), 'migrations');
const migrationFilePattern = /^(\d+)_.+\.sql$/;

/**
 * Finds migrations such as 001_create_users.sql and orders them by version.
 * A version number may describe exactly one SQL file so the execution order is
 * always unambiguous.
 */
function getMigrationFiles(): string[] {
  if (!fs.existsSync(migrationsDirectory)) {
    throw new Error(`找不到迁移目录：${migrationsDirectory}`);
  }

  const files = fs.readdirSync(migrationsDirectory)
    .filter((file) => migrationFilePattern.test(file))
    .sort((left, right) => {
      const leftVersion = Number(left.match(migrationFilePattern)?.[1]);
      const rightVersion = Number(right.match(migrationFilePattern)?.[1]);
      return leftVersion - rightVersion;
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

/** Creates the file-name based migration ledger and upgrades the old ledger. */
function ensureMigrationLedger(db: Database.Database): void {
  const columns = db.prepare("SELECT name FROM pragma_table_info('_migrations')").all() as { name: string }[];
  const usesLegacySchema = columns.length > 0 && !columns.some(({ name }) => name === 'filename');

  if (usesLegacySchema) {
    db.exec('ALTER TABLE _migrations RENAME TO _migrations_legacy');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  if (usesLegacySchema) {
    db.exec(`
      INSERT INTO _migrations (filename, applied_at)
      SELECT printf('%03d_legacy.sql', version), applied_at FROM _migrations_legacy;
      DROP TABLE _migrations_legacy;
    `);
  }
}

/**
 * Applies every SQL file that does not appear in SQLite's _migrations table.
 * Each file and its ledger entry are wrapped in one transaction, so a failed
 * migration is retried cleanly after its SQL has been fixed.
 */
export function runDatabaseMigrations(db: Database.Database): void {
  ensureMigrationLedger(db);
  const appliedFiles = new Set(
    (db.prepare('SELECT filename FROM _migrations').all() as { filename: string }[])
      .map(({ filename }) => filename),
  );

  for (const filename of getMigrationFiles()) {
    if (appliedFiles.has(filename)) continue;

    const sql = fs.readFileSync(path.join(migrationsDirectory, filename), 'utf8');
    db.transaction(() => {
      // SQLite has no `ADD COLUMN IF NOT EXISTS`. A database created by an
      // earlier interrupted deployment can already contain this column while
      // lacking the file-name ledger entry, so replaying the ALTER would make
      // every server import fail before the blog can render.
      if (filename === '006_add_post_index_metric_category.sql') {
        const hasMetricCategory = (db.prepare("SELECT name FROM pragma_table_info('post_index')").all() as { name: string }[])
          .some(({ name }) => name === 'metric_category_id');
        if (hasMetricCategory) {
          db.exec("UPDATE post_index SET metric_category_id = category_id WHERE metric_category_id = ''");
        } else {
          db.exec(sql);
        }
      } else {
        db.exec(sql);
      }
      // Parallel Next.js build workers can observe the same unapplied migration;
      // the SQL is idempotent and the ledger only needs one winner.
      db.prepare('INSERT OR IGNORE INTO _migrations (filename) VALUES (?)').run(filename);
    })();
    console.log(`[Database] 已执行迁移：${filename}`);
  }
}
