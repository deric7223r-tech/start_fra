import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getDbPool } from './db.js';
import { createLogger } from './logger.js';

const logger = createLogger('migrate');

async function main() {
  const migrationsDir = join(process.cwd(), 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    logger.info('No migrations found');
    return;
  }

  const pool = getDbPool();

  // Minimal idempotent runner: each migration file uses IF NOT EXISTS.
  for (const file of files) {
    const fullPath = join(migrationsDir, file);
    const sql = readFileSync(fullPath, 'utf8');
    logger.info(`Applying migration ${file}`);
    await pool.query(sql);
  }

  logger.info('Migrations applied');
  await pool.end();
}

main().catch((err) => {
  logger.error('Migration failed', { error: String(err) });
  process.exit(1);
});
