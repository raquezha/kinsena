import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { Cadence } from '../../domain/cadence.ts';
import type { CurrencyCode } from '../../domain/currency.ts';

// Table and column names match the databases created by Kinsena 0.1,
// so an existing data/kinsena.db keeps working.

export const templateItems = sqliteTable('template_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name', { length: 128 }).notNull(),
	defaultAmount: integer('default_amount'),
	cadence: text('cadence', { length: 32 }).$type<Cadence>().notNull().default('ANY'),
	isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at').notNull()
});

export const cycles = sqliteTable('cycles', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title', { length: 128 }).notNull(),
	date: text('date', { length: 32 }).notNull(),
	salary: integer('salary'),
	note: text('note'),
	isClosed: integer('is_closed', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at').notNull()
});

export const cycleItems = sqliteTable('cycle_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	cycleId: integer('cycle_id')
		.notNull()
		.references(() => cycles.id),
	name: text('name', { length: 128 }).notNull(),
	amount: integer('amount').notNull().default(0),
	amountExpr: text('amount_expr', { length: 256 }),
	isDone: integer('is_done', { mode: 'boolean' }).notNull().default(false),
	sortOrder: integer('sort_order').notNull().default(0)
});

export const settings = sqliteTable('settings', {
	id: integer('id').primaryKey(),
	currency: text('currency', { length: 3 }).$type<CurrencyCode>().notNull().default('PHP')
});
