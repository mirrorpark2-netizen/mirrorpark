import { createHash } from 'node:crypto';
import { sql } from '../../../lib/postgres';

type DamageLevel = { id: string; name: string; price: number };

const defaultDamageLevels: DamageLevel[] = [
  { id: 'minor', name: 'Minor Damage', price: 450 },
  { id: 'moderate', name: 'Moderate Damage', price: 650 },
  { id: 'heavy', name: 'Heavy Damage', price: 950 },
  { id: 'severe', name: 'Severe Damage', price: 1050 },
  { id: 'extreme', name: 'Extreme Damage', price: 1200 },
];

async function requireAdmin(request: Request) {
  const suppliedUsername = request.headers.get('x-admin-username');
  const suppliedPassword = request.headers.get('x-admin-password');
  const [databaseAdmin] = await sql<
    Array<{ username: string; passwordHash: string }>
  >`
    SELECT username, password_hash AS "passwordHash" FROM admin_users WHERE id = 1
  `;
  const passwordHash = suppliedPassword
    ? createHash('sha256').update(suppliedPassword).digest('hex')
    : '';
  if (
    databaseAdmin &&
    suppliedUsername === databaseAdmin.username &&
    passwordHash === databaseAdmin.passwordHash
  )
    return true;
  const configuredUsername = process.env.MP_ADMIN_USERNAME || 'Uddin';
  const configuredPassword = process.env.MP_ADMIN_PASSWORD;
  return Boolean(
    configuredPassword &&
    suppliedUsername === configuredUsername &&
    suppliedPassword === configuredPassword,
  );
}

function normalizeDamageLevels(value: unknown): DamageLevel[] | null {
  if (!Array.isArray(value) || value.length !== defaultDamageLevels.length)
    return null;
  const normalized = value.map((entry, index) => {
    if (!entry || typeof entry !== 'object') return null;
    const candidate = entry as Record<string, unknown>;
    const name =
      typeof candidate.name === 'string' ? candidate.name.trim() : '';
    const price = Number(candidate.price);
    if (!name || !Number.isFinite(price) || price < 0) return null;
    return { id: defaultDamageLevels[index].id, name, price };
  });
  return normalized.every(Boolean) ? (normalized as DamageLevel[]) : null;
}

export async function GET() {
  const [setting] = await sql<Array<{ value: unknown }>>`
    SELECT value FROM business_settings WHERE key = 'damage_levels'
  `;
  return Response.json({
    damageLevels: normalizeDamageLevels(setting?.value) || defaultDamageLevels,
  });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin(request)))
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  const input = (await request.json()) as { damageLevels?: unknown };
  const damageLevels = normalizeDamageLevels(input.damageLevels);
  if (!damageLevels)
    return Response.json(
      { error: 'Provide all five damage levels with valid names and prices.' },
      { status: 400 },
    );
  await sql`
    INSERT INTO business_settings (key, value, updated_at)
    VALUES ('damage_levels', ${JSON.stringify(damageLevels)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
  return Response.json({ status: 'saved', damageLevels });
}
