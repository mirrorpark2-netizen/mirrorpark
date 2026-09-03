import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import { sql } from './postgres';

export type AuthenticatedUser = {
  kind: 'admin' | 'employee';
  employeeId: number | null;
  name: string;
  role: string;
  initials: string;
};

export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
};

export const verifyPassword = (password: string, stored: string | null) => {
  if (!stored) return false;
  const [salt, expectedHex] = stored.split(':');
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

export async function getAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';
  if (!token) return null;

  const [session] = await sql<
    Array<{
      isAdmin: boolean;
      employeeId: number | null;
      name: string | null;
      role: string | null;
      initials: string | null;
    }>
  >`
    SELECT s.is_admin AS "isAdmin", s.employee_id AS "employeeId",
           e.name, e.role, e.initials
    FROM sessions s
    LEFT JOIN employees e ON e.id = s.employee_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > NOW()
  `;
  if (!session) return null;
  if (session.isAdmin) {
    return {
      kind: 'admin',
      employeeId: null,
      name: 'Administrator',
      role: 'Administrator',
      initials: 'AD',
    };
  }
  if (!session.employeeId || !session.name) return null;
  return {
    kind: 'employee',
    employeeId: Number(session.employeeId),
    name: session.name,
    role: session.role || 'Mechanic',
    initials: session.initials || 'EM',
  };
}

export async function requireAdmin(request: Request) {
  const user = await getAuthenticatedUser(request);
  return user?.kind === 'admin' ? user : null;
}
