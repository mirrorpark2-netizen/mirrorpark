import { sql } from '../../../lib/postgres';
import { createHash } from 'node:crypto';
import { hashPassword, requireAdmin } from '../../../lib/auth';

export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  const [applications, employees] = await Promise.all([
    sql<Array<Record<string, unknown>>>`
      SELECT id, discord, game_id AS "gameId", game_name AS "gameName", mobile, cid,
             status, requested_at AS "requestedAt", assigned_role AS "assignedRole"
      FROM applications WHERE status = 'pending' ORDER BY requested_at DESC
    `,
    sql<Array<Record<string, unknown>>>`
      SELECT id, name, role, week, month, status, initials, invoices, discord,
             game_id AS "gameId", mobile, cid
      FROM employees ORDER BY id ASC
    `,
  ]);
  return Response.json({ applications, employees });
}

export async function POST(request: Request) {
  const input = (await request.json()) as Record<string, unknown>;
  const fields = ['discord', 'gameId', 'gameName', 'mobile', 'cid'] as const;
  if (
    fields.some(
      (field) =>
        typeof input[field] !== 'string' || !(input[field] as string).trim(),
    )
  ) {
    return Response.json({ error: 'All fields are required' }, { status: 400 });
  }
  const password = typeof input.password === 'string' ? input.password : '';
  if (password.length < 8) {
    return Response.json(
      { error: 'Use an account password with at least 8 characters.' },
      { status: 400 },
    );
  }
  const passwordHash = hashPassword(password);
  const id = `APP-${crypto.randomUUID()}`;
  await sql`
    INSERT INTO applications (id, discord, game_id, game_name, mobile, cid, password_hash, status, requested_at, assigned_role)
    VALUES (${id}, ${(input.discord as string).trim()}, ${(input.gameId as string).trim()},
            ${(input.gameName as string).trim()}, ${(input.mobile as string).trim()},
            ${(input.cid as string).trim()}, ${passwordHash}, 'pending', NOW(), 'Mechanic')
  `;
  return Response.json({ id, status: 'pending' }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin(request)))
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  const input = (await request.json()) as {
    action?: string;
    id?: string;
    role?: string;
    username?: string;
    password?: string;
  };
  if (input.action === 'update-credentials') {
    const username = input.username?.trim();
    const password = input.password;
    if (!username || !password || password.length < 8) {
      return Response.json(
        { error: 'Use a username and a password with at least 8 characters.' },
        { status: 400 },
      );
    }
    const passwordHash = createHash('sha256').update(password).digest('hex');
    await sql`
      INSERT INTO admin_users (id, username, password_hash, updated_at)
      VALUES (1, ${username}, ${passwordHash}, NOW())
      ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash, updated_at = NOW()
    `;
    return Response.json({ status: 'updated', username });
  }
  if (!input.id || !['accept', 'reject'].includes(input.action || '')) {
    return Response.json({ error: 'Invalid decision' }, { status: 400 });
  }
  if (input.action === 'reject') {
    await sql`DELETE FROM applications WHERE id = ${input.id}`;
    return Response.json({ status: 'rejected' });
  }
  const [application] = await sql<
    Array<{
      discord: string;
      gameId: string;
      gameName: string;
      mobile: string;
      cid: string;
      passwordHash: string | null;
    }>
  >`
    SELECT discord, game_id AS "gameId", game_name AS "gameName", mobile, cid,
           password_hash AS "passwordHash"
    FROM applications WHERE id = ${input.id}
  `;
  if (!application)
    return Response.json({ error: 'Application not found' }, { status: 404 });
  const role = input.role?.trim() || 'Mechanic';
  const initials =
    application.gameName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'NE';
  await sql`
    INSERT INTO employees (name, role, week, month, status, initials, invoices, discord, game_id, mobile, cid, password_hash)
    VALUES (${application.gameName}, ${role}, '0h 00m', '0h 00m', 'Off duty', ${initials}, 0,
            ${application.discord}, ${application.gameId}, ${application.mobile}, ${application.cid}, ${application.passwordHash})
  `;
  await sql`DELETE FROM applications WHERE id = ${input.id}`;
  return Response.json({ status: 'accepted' });
}
