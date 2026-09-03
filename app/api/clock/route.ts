import { getAuthenticatedUser } from '../../../lib/auth';
import { sql } from '../../../lib/postgres';

async function clockState(employeeId: number) {
  const [employee, openShift] = await Promise.all([
    sql<
      Array<{
        weekMinutes: number;
        monthMinutes: number;
        status: string;
      }>
    >`
      SELECT week_minutes AS "weekMinutes", month_minutes AS "monthMinutes", status
      FROM employees WHERE id = ${employeeId}
    `,
    sql<Array<{ checkedInAt: string }>>`
      SELECT checked_in_at AS "checkedInAt"
      FROM shifts WHERE employee_id = ${employeeId} AND checked_out_at IS NULL
      ORDER BY checked_in_at DESC LIMIT 1
    `,
  ]);
  return {
    checkedIn: Boolean(openShift[0]),
    checkedInAt: openShift[0]?.checkedInAt || null,
    weekMinutes: Number(employee[0]?.weekMinutes || 0),
    monthMinutes: Number(employee[0]?.monthMinutes || 0),
    status: employee[0]?.status || 'Off duty',
  };
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user)
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  if (user.kind !== 'employee' || !user.employeeId) {
    return Response.json({
      checkedIn: false,
      checkedInAt: null,
      weekMinutes: 0,
      monthMinutes: 0,
      admin: true,
    });
  }
  return Response.json(await clockState(user.employeeId));
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user)
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  if (user.kind !== 'employee' || !user.employeeId) {
    return Response.json(
      { error: 'Only employee accounts can use the time clock.' },
      { status: 403 },
    );
  }
  const input = (await request.json()) as { action?: string };
  if (input.action === 'check-in') {
    await sql`
      INSERT INTO shifts (employee_id, checked_in_at)
      SELECT ${user.employeeId}, NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM shifts WHERE employee_id = ${user.employeeId} AND checked_out_at IS NULL
      )
    `;
    await sql`UPDATE employees SET status = 'On duty' WHERE id = ${user.employeeId}`;
  } else if (input.action === 'check-out') {
    const [closed] = await sql<Array<{ minutes: number }>>`
      UPDATE shifts SET checked_out_at = NOW()
      WHERE id = (
        SELECT id FROM shifts
        WHERE employee_id = ${user.employeeId} AND checked_out_at IS NULL
        ORDER BY checked_in_at DESC LIMIT 1
      )
      RETURNING GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (checked_out_at - checked_in_at)) / 60))::int AS minutes
    `;
    const minutes = Number(closed?.minutes || 0);
    await sql`
      UPDATE employees SET
        status = 'Off duty',
        week_minutes = week_minutes + ${minutes},
        month_minutes = month_minutes + ${minutes},
        week = CONCAT(FLOOR((week_minutes + ${minutes}) / 60), 'h ', LPAD(((week_minutes + ${minutes}) % 60)::text, 2, '0'), 'm'),
        month = CONCAT(FLOOR((month_minutes + ${minutes}) / 60), 'h ', LPAD(((month_minutes + ${minutes}) % 60)::text, 2, '0'), 'm')
      WHERE id = ${user.employeeId}
    `;
  } else {
    return Response.json({ error: 'Invalid clock action.' }, { status: 400 });
  }
  return Response.json(await clockState(user.employeeId));
}
