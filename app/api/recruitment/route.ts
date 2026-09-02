import { getChatGPTUser } from '../../chatgpt-auth';
import { sql } from '../../../lib/postgres';

async function requireAdmin(request: Request) {
  const configuredPassword = process.env.MP_ADMIN_PASSWORD;
  const suppliedPassword = request.headers.get('x-admin-password');
  if (configuredPassword && suppliedPassword === configuredPassword) return true;
  const user = await getChatGPTUser();
  const adminEmail = process.env.MP_ADMIN_EMAIL;
  return Boolean(user && (!adminEmail || user.email.toLowerCase() === adminEmail.toLowerCase()));
}

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: 'Admin access required' }, { status: 403 });
  const [applications, employees] = await Promise.all([
    sql<Array<Record<string, unknown>>>`
      SELECT id, discord, game_id AS "gameId", game_name AS "gameName", mobile, cid,
             status, requested_at AS "requestedAt", assigned_role AS "assignedRole"
      FROM applications WHERE status = 'pending' ORDER BY requested_at DESC`,
    sql<Array<Record<string, unknown>>>`
      SELECT name, role, week, month, status, initials, invoices, discord,
             game_id AS "gameId", mobile, cid
      FROM employees ORDER BY id ASC`,
  ]);
  return Response.json({ applications, employees });
}

export async function POST(request: Request) {
  const input = await request.json() as Record<string, unknown>;
  const fields = ['discord', 'gameId', 'gameName', 'mobile', 'cid'] as const;
  if (fields.some(field => typeof input[field] !== 'string' || !(input[field] as string).trim())) {
    return Response.json({ error: 'All fields are required' }, { status: 400 });
  }
  const id = `APP-${crypto.randomUUID()}`;
  await sql`
    INSERT INTO applications (id, discord, game_id, game_name, mobile, cid, status, requested_at, assigned_role)
    VALUES (${id}, ${(input.discord as string).trim()}, ${(input.gameId as string).trim()},
            ${(input.gameName as string).trim()}, ${(input.mobile as string).trim()},
            ${(input.cid as string).trim()}, 'pending', NOW(), 'Mechanic')`;
  return Response.json({ id, status: 'pending' }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: 'Admin access required' }, { status: 403 });
  const input = await request.json() as { action?: string; id?: string; role?: string };
  if (!input.id || !['accept', 'reject'].includes(input.action || '')) {
    return Response.json({ error: 'Invalid decision' }, { status: 400 });
  }
  if (input.action === 'reject') {
    await sql`DELETE FROM applications WHERE id = ${input.id}`;
    return Response.json({ status: 'rejected' });
  }
  const [application] = await sql<Array<{ discord: string; gameId: string; gameName: string; mobile: string; cid: string }>>`
    SELECT discord, game_id AS "gameId", game_name AS "gameName", mobile, cid
    FROM applications WHERE id = ${input.id}`;
  if (!application) return Response.json({ error: 'Application not found' }, { status: 404 });
  const role = input.role?.trim() || 'Mechanic';
  const initials = application.gameName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'NE';
  await sql`
    INSERT INTO employees (name, role, week, month, status, initials, invoices, discord, game_id, mobile, cid)
    VALUES (${application.gameName}, ${role}, '0h 00m', '0h 00m', 'Off duty', ${initials}, 0,
            ${application.discord}, ${application.gameId}, ${application.mobile}, ${application.cid})`;
  await sql`DELETE FROM applications WHERE id = ${input.id}`;
  return Response.json({ status: 'accepted' });
}
