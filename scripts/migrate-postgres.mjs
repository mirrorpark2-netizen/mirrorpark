import postgres from 'postgres';
import { createHash } from 'node:crypto';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error('DATABASE_URL is required to run database migrations.');

const sql = postgres(databaseUrl, { max: 1, connect_timeout: 20 });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      discord TEXT NOT NULL,
      game_id TEXT NOT NULL,
      game_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      cid TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      assigned_role TEXT NOT NULL DEFAULT 'Mechanic'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS employees (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      week TEXT NOT NULL DEFAULT '0h 00m',
      month TEXT NOT NULL DEFAULT '0h 00m',
      status TEXT NOT NULL DEFAULT 'Off duty',
      initials TEXT NOT NULL,
      invoices INTEGER NOT NULL DEFAULT 0,
      discord TEXT,
      game_id TEXT,
      mobile TEXT,
      cid TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS business_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const adminUsername = process.env.MP_ADMIN_USERNAME;
  const adminPassword = process.env.MP_ADMIN_PASSWORD;
  if (adminUsername && adminPassword) {
    const passwordHash = createHash('sha256')
      .update(adminPassword)
      .digest('hex');
    await sql`
      INSERT INTO admin_users (id, username, password_hash)
      VALUES (1, ${adminUsername}, ${passwordHash})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  await sql`CREATE INDEX IF NOT EXISTS applications_status_requested_idx ON applications (status, requested_at DESC)`;
  console.log('PostgreSQL schema is ready.');
} finally {
  await sql.end();
}
