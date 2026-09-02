import { createRequire } from 'node:module';
import type postgresType from 'postgres';

const require = createRequire(import.meta.url);
const postgres = require('postgres') as typeof postgresType;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured.');
}

export const sql = postgres(databaseUrl, {
  max: 8,
  idle_timeout: 20,
  connect_timeout: 15,
});
