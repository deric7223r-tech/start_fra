import { getDbPool } from '../db.js';
import type { User, DbUserRow } from '../types.js';

export async function dbGetUserByEmail(email: string): Promise<User | null> {
  const pool = getDbPool();
  const res = await pool.query<DbUserRow>(
    'select id, email, name, password_hash, role, organisation_id, created_at from public.users where email = $1 limit 1',
    [email.toLowerCase()]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role,
    organisationId: row.organisation_id,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function dbGetUserById(id: string): Promise<User | null> {
  const pool = getDbPool();
  const res = await pool.query<DbUserRow>(
    'select id, email, name, password_hash, role, organisation_id, created_at from public.users where id = $1 limit 1',
    [id]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role,
    organisationId: row.organisation_id,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function dbInsertUser(user: User): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    'insert into public.users (id, email, name, password_hash, role, organisation_id, created_at) values ($1,$2,$3,$4,$5,$6,$7)',
    [
      user.id,
      user.email.toLowerCase(),
      user.name,
      user.passwordHash,
      user.role,
      user.organisationId,
      user.createdAt,
    ]
  );
}

export async function dbUpdateUserPasswordHash(userId: string, passwordHash: string): Promise<void> {
  const pool = getDbPool();
  await pool.query('update public.users set password_hash = $1 where id = $2', [passwordHash, userId]);
}
