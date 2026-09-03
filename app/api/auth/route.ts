import { createHash, randomBytes } from 'node:crypto';
import {
  getAuthenticatedUser,
  hashToken,
  verifyPassword,
} from '../../../lib/auth';
import { sql } from '../../../lib/postgres';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user)
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  return Response.json({ user });
}

export async function POST(request: Request) {
  const input = (await request.json()) as {
    username?: string;
    password?: string;
  };
  const username = input.username?.trim() || '';
  const password = input.password || '';
  if (!username || !password) {
    return Response.json(
      { error: 'Enter your username and password.' },
      { status: 400 },
    );
  }

  const passwordHash = createHash('sha256').update(password).digest('hex');
  const [databaseAdmin] = await sql<
    Array<{ username: string; passwordHash: string }>
  >`
    SELECT username, password_hash AS "passwordHash"
    FROM admin_users WHERE id = 1
  `;
  const configuredUsername = process.env.MP_ADMIN_USERNAME || 'Uddin';
  const configuredPassword = process.env.MP_ADMIN_PASSWORD;
  const isAdmin = databaseAdmin
    ? username === databaseAdmin.username &&
      passwordHash === databaseAdmin.passwordHash
    : Boolean(
        configuredPassword &&
        username === configuredUsername &&
        password === configuredPassword,
      );

  let employee: {
    id: number;
    name: string;
    role: string;
    initials: string;
    passwordHash: string | null;
  } | null = null;
  if (!isAdmin) {
    const [match] = await sql<
      Array<{
        id: number;
        name: string;
        role: string;
        initials: string;
        passwordHash: string | null;
      }>
    >`
      SELECT id, name, role, initials, password_hash AS "passwordHash"
      FROM employees
      WHERE LOWER(discord) = LOWER(${username})
      LIMIT 1
    `;
    employee =
      match && verifyPassword(password, match.passwordHash) ? match : null;
  }

  if (!isAdmin && !employee) {
    return Response.json(
      {
        error: 'Incorrect sign-in details or your application is not approved.',
      },
      { status: 401 },
    );
  }

  const token = randomBytes(32).toString('hex');
  await sql`
    INSERT INTO sessions (token_hash, employee_id, is_admin, expires_at)
    VALUES (${hashToken(token)}, ${employee?.id || null}, ${isAdmin}, NOW() + INTERVAL '7 days')
  `;
  const user = isAdmin
    ? {
        kind: 'admin' as const,
        employeeId: null,
        name: 'Administrator',
        role: 'Administrator',
        initials: 'AD',
      }
    : {
        kind: 'employee' as const,
        employeeId: Number(employee!.id),
        name: employee!.name,
        role: employee!.role,
        initials: employee!.initials,
      };
  return Response.json({ token, user });
}

export async function DELETE(request: Request) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';
  if (token)
    await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  return Response.json({ status: 'signed-out' });
}
