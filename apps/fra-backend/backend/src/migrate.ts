import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getDbPool } from './db';

async function main() {
  const migrationsDir = join(process.cwd(), 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log('No migrations found');
    return;
  }

  const pool = getDbPool();

  // Minimal idempotent runner: each migration file uses IF NOT EXISTS.
  for (const file of files) {
    const fullPath = join(migrationsDir, file);
    const sql = readFileSync(fullPath, 'utf8');
    console.log(`Applying migration ${file}`);
    await pool.query(sql);
  }

  console.log('Migrations applied');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
