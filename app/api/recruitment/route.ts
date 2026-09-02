import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';

type RuntimeEnv = { DB: D1Database; MP_ADMIN_EMAIL?: string };

async function requireAdmin() {
  const user = await getChatGPTUser();
  const adminEmail = (env as unknown as RuntimeEnv).MP_ADMIN_EMAIL;
  if (!user || (adminEmail && user.email.toLowerCase() !== adminEmail.toLowerCase())) return null;
  return user;
}

export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: 'Admin access required' }, { status: 403 });
  const db = (env as unknown as RuntimeEnv).DB;
  const [applicationResult, employeeResult] = await Promise.all([
    db.prepare('SELECT id, discord, game_id AS gameId, game_name AS gameName, mobile, cid, status, requested_at AS requestedAt, assigned_role AS assignedRole FROM applications WHERE status = ? ORDER BY requested_at DESC').bind('pending').all(),
    db.prepare('SELECT name, role, week, month, status, initials, invoices, discord, game_id AS gameId, mobile, cid FROM employees ORDER BY id ASC').all(),
  ]);
  return Response.json({ applications: applicationResult.results, employees: employeeResult.results });
}

export async function POST(request: Request) {
  const input = await request.json() as Record<string, unknown>;
  const fields = ['discord', 'gameId', 'gameName', 'mobile', 'cid'] as const;
  if (fields.some(field => typeof input[field] !== 'string' || !(input[field] as string).trim())) return Response.json({ error: 'All fields are required' }, { status: 400 });
  const id = `APP-${crypto.randomUUID()}`;
  const requestedAt = new Date().toISOString();
  await (env as unknown as RuntimeEnv).DB.prepare('INSERT INTO applications (id, discord, game_id, game_name, mobile, cid, status, requested_at, assigned_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, input.discord, input.gameId, input.gameName, input.mobile, input.cid, 'pending', requestedAt, 'Mechanic').run();
  return Response.json({ id, status: 'pending' }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) return Response.json({ error: 'Admin access required' }, { status: 403 });
  const input = await request.json() as { action?: string; id?: string; role?: string };
  if (!input.id || !['accept', 'reject'].includes(input.action || '')) return Response.json({ error: 'Invalid decision' }, { status: 400 });
  const db = (env as unknown as RuntimeEnv).DB;
  if (input.action === 'reject') { await db.prepare('DELETE FROM applications WHERE id = ?').bind(input.id).run(); return Response.json({ status: 'rejected' }); }
  const application = await db.prepare('SELECT discord, game_id AS gameId, game_name AS gameName, mobile, cid FROM applications WHERE id = ?').bind(input.id).first<Record<string, string>>();
  if (!application) return Response.json({ error: 'Application not found' }, { status: 404 });
  const role = input.role?.trim() || 'Mechanic';
  const initials = application.gameName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'NE';
  await db.batch([
    db.prepare('INSERT INTO employees (name, role, week, month, status, initials, invoices, discord, game_id, mobile, cid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(application.gameName, role, '0h 00m', '0h 00m', 'Off duty', initials, 0, application.discord, application.gameId, application.mobile, application.cid),
    db.prepare('DELETE FROM applications WHERE id = ?').bind(input.id),
  ]);
  return Response.json({ status: 'accepted' });
}
