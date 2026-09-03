import {
  getAuthenticatedUser,
  hashPassword,
  requireAdmin,
} from '../../../lib/auth';
import { sql } from '../../../lib/postgres';

const formatMinutes = (minutes: number) =>
  `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;

const textValue = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;

const parseMinutes = (value: unknown) => {
  const text = textValue(value);
  const hours = Number(text.match(/(\d+)\s*h/i)?.[1] || 0);
  const minutes = Number(text.match(/(\d+)\s*m/i)?.[1] || 0);
  return Math.max(0, hours * 60 + minutes);
};

async function listEmployees() {
  const rows = await sql<
    Array<{
      id: number;
      name: string;
      role: string;
      weekMinutes: number;
      monthMinutes: number;
      status: string;
      initials: string;
      invoices: number;
      discord: string | null;
      gameId: string | null;
      mobile: string | null;
      cid: string | null;
      photoUrl: string | null;
    }>
  >`
    SELECT id, name, role, week_minutes AS "weekMinutes",
           month_minutes AS "monthMinutes", status, initials, invoices,
           discord, game_id AS "gameId", mobile, cid,
           photo_url AS "photoUrl"
    FROM employees ORDER BY id ASC
  `;
  return rows.map((employee) => ({
    ...employee,
    id: Number(employee.id),
    week: formatMinutes(Number(employee.weekMinutes || 0)),
    month: formatMinutes(Number(employee.monthMinutes || 0)),
  }));
}

export async function GET(request: Request) {
  if (!(await getAuthenticatedUser(request))) {
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  }
  return Response.json({ employees: await listEmployees() });
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  const input = (await request.json()) as Record<string, unknown>;
  const name = textValue(input.name, 'New Employee').trim() || 'New Employee';
  const initials =
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'NE';
  const [employee] = await sql<Array<{ id: number }>>`
    INSERT INTO employees (name, role, week, month, week_minutes, month_minutes, status, initials, invoices, discord, game_id, mobile, cid)
    VALUES (${name}, ${textValue(input.role, 'Mechanic')}, '0h 00m', '0h 00m', 0, 0,
            'Off duty', ${initials}, 0, NULL, NULL, NULL, NULL)
    RETURNING id
  `;
  return Response.json({ id: Number(employee.id) }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  const input = (await request.json()) as Record<string, unknown>;
  const id = Number(input.id);
  const name = textValue(input.name).trim();
  if (!id || !name) {
    return Response.json(
      { error: 'Employee and name are required.' },
      { status: 400 },
    );
  }
  const initials =
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'NE';
  const password = textValue(input.loginPassword);
  if (password && password.length < 8) {
    return Response.json(
      { error: 'Employee passwords must contain at least 8 characters.' },
      { status: 400 },
    );
  }
  const passwordHash = password ? hashPassword(password) : null;
  const photoUrl = textValue(input.photoUrl).trim();
  if (
    photoUrl &&
    (!/^data:image\/(?:jpeg|png|webp);base64,/i.test(photoUrl) ||
      photoUrl.length > 1_500_000)
  ) {
    return Response.json(
      { error: 'The employee photo is invalid or too large.' },
      { status: 400 },
    );
  }
  await sql`
    UPDATE employees SET
      name = ${name}, role = ${textValue(input.role, 'Mechanic')},
      week = ${textValue(input.week, '0h 00m')}, month = ${textValue(input.month, '0h 00m')},
      week_minutes = ${parseMinutes(input.week)}, month_minutes = ${parseMinutes(input.month)},
      status = ${textValue(input.status, 'Off duty')}, initials = ${initials},
      invoices = ${Math.max(0, Number(input.invoices) || 0)},
      discord = ${textValue(input.discord).trim() || null},
      game_id = ${textValue(input.gameId).trim() || null},
      mobile = ${textValue(input.mobile).trim() || null},
      cid = ${textValue(input.cid).trim() || null},
      photo_url = ${photoUrl || null},
      password_hash = CASE WHEN ${passwordHash}::text IS NULL THEN password_hash ELSE ${passwordHash} END
    WHERE id = ${id}
  `;
  return Response.json({ status: 'updated' });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!id)
    return Response.json({ error: 'Employee is required.' }, { status: 400 });
  await sql`DELETE FROM employees WHERE id = ${id}`;
  return Response.json({ status: 'removed' });
}
