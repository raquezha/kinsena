import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { PaydayCadence } from '../../domain/cadence.ts';
import type { CurrencyCode } from '../../domain/currency.ts';
import type { Decision } from '../../domain/decision.ts';
import type { DestinationKind } from '../../domain/destination.ts';
import type { FundFrom } from '../../domain/fund-from.ts';
import type { HolidayKind, PayRule } from '../../domain/pay-rule.ts';

// template_items and settings keep the names from Kinsena 0.1 so existing
// databases can be altered in place. cycles / cycle_items are migrated
// into paydays / route_items by 0001_payday_routing.sql.

export const destinations = sqliteTable('destinations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name', { length: 128 }).notNull(),
	kind: text('kind', { length: 32 }).$type<DestinationKind>().notNull(),
	isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at').notNull()
});

export const templateItems = sqliteTable('template_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name', { length: 128 }).notNull(),
	defaultAmount: integer('default_amount'),
	minimumAmount: integer('minimum_amount'),
	dueDay: integer('due_day'),
	fundFrom: text('fund_from', { length: 32 }).$type<FundFrom>().notNull().default('BEFORE_DUE'),
	destinationId: integer('destination_id').references(() => destinations.id),
	// Kept so 0.1 databases that still have this column stay readable.
	cadence: text('cadence', { length: 32 }).notNull().default('ANY'),
	/** null = not an installment plan. */
	installmentCount: integer('installment_count'),
	installmentsCompleted: integer('installments_completed').notNull().default(0),
	isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at').notNull()
});

export const paydays = sqliteTable('paydays', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title', { length: 128 }).notNull(),
	cadence: text('cadence', { length: 32 }).$type<PaydayCadence>().notNull(),
	scheduledDate: text('scheduled_date', { length: 32 }).notNull(),
	payDate: text('pay_date', { length: 32 }).notNull(),
	expectedAmount: integer('expected_amount'),
	receivedAmount: integer('received_amount'),
	receivedAt: text('received_at', { length: 32 }),
	note: text('note'),
	isClosed: integer('is_closed', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at').notNull()
});

export const routeItems = sqliteTable(
	'route_items',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		paydayId: integer('payday_id').references(() => paydays.id),
		destinationId: integer('destination_id').references(() => destinations.id),
		name: text('name', { length: 128 }).notNull(),
		fullAmount: integer('full_amount').notNull().default(0),
		fullAmountExpr: text('full_amount_expr', { length: 256 }),
		minimumAmount: integer('minimum_amount'),
		chosenAmount: integer('chosen_amount').notNull().default(0),
		decision: text('decision', { length: 32 }).$type<Decision>().notNull().default('PENDING'),
		decisionReason: text('decision_reason', { length: 280 }),
		dueDate: text('due_date', { length: 32 }),
		isDone: integer('is_done', { mode: 'boolean' }).notNull().default(false),
		sortOrder: integer('sort_order').notNull().default(0),
		templateId: integer('template_id')
	},
	(table) => [index('route_items_payday_id_idx').on(table.paydayId)]
);

export const settings = sqliteTable('settings', {
	id: integer('id').primaryKey(),
	currency: text('currency', { length: 3 }).$type<CurrencyCode>().notNull().default('PHP'),
	midMonthSalary: integer('mid_month_salary'),
	monthEndSalary: integer('month_end_salary'),
	payRule: text('pay_rule', { mode: 'json' }).$type<PayRule>()
});

export const holidays = sqliteTable(
	'holidays',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		date: text('date', { length: 32 }).notNull(),
		name: text('name', { length: 128 }).notNull(),
		kind: text('kind', { length: 32 }).$type<HolidayKind>().notNull(),
		createdAt: integer('created_at').notNull()
	},
	(table) => [uniqueIndex('holidays_date_name_idx').on(table.date, table.name)]
);

export const payDateOverrides = sqliteTable('pay_date_overrides', {
	scheduledDate: text('scheduled_date', { length: 32 }).primaryKey(),
	payDate: text('pay_date', { length: 32 }).notNull()
});
