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

  await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS week_minutes INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS month_minutes INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_hash TEXT`;
  await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS password_hash TEXT`;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL`;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS credential_seed_version TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shifts (
      id BIGSERIAL PRIMARY KEY,
      employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checked_out_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      customer TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      total NUMERIC(12, 2) NOT NULL,
      lines JSONB NOT NULL DEFAULT '[]'::jsonb,
      message TEXT NOT NULL DEFAULT '',
      damage JSONB,
      mechanic_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
      mechanic_name TEXT NOT NULL
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
    const credentialSeedVersion = '2026-09-04-admin-reset-v1';
    const passwordHash = createHash('sha256')
      .update(adminPassword)
      .digest('hex');
    await sql`
      INSERT INTO admin_users (id, username, password_hash, credential_seed_version)
      VALUES (1, ${adminUsername}, ${passwordHash}, ${credentialSeedVersion})
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        credential_seed_version = EXCLUDED.credential_seed_version,
        updated_at = NOW()
      WHERE admin_users.credential_seed_version IS DISTINCT FROM ${credentialSeedVersion}
    `;
  }

  // An administrator is also a staff member so the owner can use the normal
  // clock and invoice workflow without impersonating another employee.
  const [adminUser] = await sql`
    SELECT employee_id AS "employeeId" FROM admin_users WHERE id = 1
  `;
  if (adminUser && !adminUser.employeeId) {
    const [adminEmployee] = await sql`
      INSERT INTO employees (name, role, week, month, week_minutes, month_minutes, status, initials, invoices, discord)
      VALUES ('Administrator', 'Administrator', '0h 00m', '0h 00m', 0, 0, 'Off duty', 'AD', 0, ${adminUsername || 'administrator'})
      RETURNING id
    `;
    await sql`
      UPDATE admin_users SET employee_id = ${adminEmployee.id} WHERE id = 1
    `;
    await sql`
      UPDATE sessions SET employee_id = ${adminEmployee.id}
      WHERE is_admin = TRUE AND employee_id IS NULL
    `;
  }

  await sql`CREATE INDEX IF NOT EXISTS applications_status_requested_idx ON applications (status, requested_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS shifts_one_open_per_employee_idx ON shifts (employee_id) WHERE checked_out_at IS NULL`;
  await sql`CREATE INDEX IF NOT EXISTS invoices_created_idx ON invoices (created_at DESC)`;
  console.log('PostgreSQL schema is ready.');
} finally {
  await sql.end();
}
