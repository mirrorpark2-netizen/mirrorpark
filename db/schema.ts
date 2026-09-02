import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const applications = sqliteTable('applications', {
  id: text('id').primaryKey(),
  discord: text('discord').notNull(),
  gameId: text('game_id').notNull(),
  gameName: text('game_name').notNull(),
  mobile: text('mobile').notNull(),
  cid: text('cid').notNull(),
  status: text('status').notNull().default('pending'),
  requestedAt: text('requested_at').notNull(),
  assignedRole: text('assigned_role').notNull().default('Mechanic'),
});

export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  role: text('role').notNull(),
  week: text('week').notNull().default('0h 00m'),
  month: text('month').notNull().default('0h 00m'),
  status: text('status').notNull().default('Off duty'),
  initials: text('initials').notNull(),
  invoices: integer('invoices').notNull().default(0),
  discord: text('discord'),
  gameId: text('game_id'),
  mobile: text('mobile'),
  cid: text('cid'),
});
