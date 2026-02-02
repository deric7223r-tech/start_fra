import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const useSsl = connectionString.includes('sslmode=require');

  pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });

  return pool;
}
