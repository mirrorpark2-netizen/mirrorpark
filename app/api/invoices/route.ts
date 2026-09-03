import { getAuthenticatedUser } from '../../../lib/auth';
import { sql } from '../../../lib/postgres';

export async function GET(request: Request) {
  if (!(await getAuthenticatedUser(request))) {
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  }
  const invoices = await sql<Array<Record<string, unknown>>>`
    SELECT id, customer, created_at AS date, total, lines, message, damage,
           mechanic_name AS "mechanicName"
    FROM invoices ORDER BY created_at DESC
  `;
  return Response.json({
    invoices: invoices.map((invoice) => ({
      ...invoice,
      total: Number(invoice.total),
      date: new Date(invoice.date as string).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user)
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  const input = (await request.json()) as {
    customer?: string;
    total?: number;
    lines?: unknown;
    message?: string;
    damage?: unknown;
  };
  const total = Number(input.total);
  if (!Number.isFinite(total) || total < 0 || !Array.isArray(input.lines)) {
    return Response.json({ error: 'Invalid invoice.' }, { status: 400 });
  }
  const id = `MP-${Date.now().toString().slice(-7)}`;
  const [invoice] = await sql<Array<Record<string, unknown>>>`
    INSERT INTO invoices (id, customer, total, lines, message, damage, mechanic_id, mechanic_name)
    VALUES (${id}, ${input.customer?.trim() || 'Walk-in customer'}, ${total},
            ${JSON.stringify(input.lines)}::jsonb, ${input.message || ''},
            ${JSON.stringify(input.damage || null)}::jsonb, ${user.employeeId}, ${user.name})
    RETURNING id, customer, created_at AS date, total, lines, message, damage,
              mechanic_name AS "mechanicName"
  `;
  if (user.employeeId) {
    await sql`UPDATE employees SET invoices = invoices + 1 WHERE id = ${user.employeeId}`;
  }
  return Response.json(
    {
      invoice: {
        ...invoice,
        total: Number(invoice.total),
        date: new Date(invoice.date as string).toLocaleString('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      },
    },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user)
    return Response.json({ error: 'Sign in required' }, { status: 401 });
  if (user.kind !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id)
    return Response.json({ error: 'Invoice is required.' }, { status: 400 });
  const [removed] = await sql<Array<{ mechanicId: number | null }>>`
    DELETE FROM invoices WHERE id = ${id}
    RETURNING mechanic_id AS "mechanicId"
  `;
  if (removed?.mechanicId) {
    await sql`
      UPDATE employees SET invoices = GREATEST(0, invoices - 1)
      WHERE id = ${removed.mechanicId}
    `;
  }
  return Response.json({ status: 'removed' });
}
