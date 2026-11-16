import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PAY_RULE } from '../../../domain/pay-rule.ts';
import { OFFICIAL_NATIONAL_HOLIDAYS } from '../holiday-seed.ts';
import { createMemoryRepositories } from '../../testing/memory-repositories.ts';
import type { NewPayday, NewRouteItem, Repositories } from '../../ports.ts';
import { openDatabase } from '../database.ts';
import { migrateDatabase } from '../migrate.ts';
import { createSqliteRepositories } from './index.ts';

function sqliteRepositories(): Repositories {
	const handle = openDatabase(':memory:');
	migrateDatabase(handle, resolve('drizzle'));
	return createSqliteRepositories(handle);
}

const newPayday: NewPayday = {
	title: 'October 15',
	cadence: 'MID_MONTH',
	scheduledDate: '2026-10-15',
	payDate: '2026-10-15',
	expectedAmount: null,
	receivedAmount: null,
	receivedAt: null,
	note: null,
	createdAt: 1
};

const item = (name: string, sortOrder: number, paydayId: number | null = 1): NewRouteItem => ({
	paydayId,
	destinationId: null,
	name,
	fullAmount: 100,
	fullAmountExpr: '1',
	minimumAmount: null,
	chosenAmount: 0,
	decision: 'PENDING',
	decisionReason: null,
	dueDate: null,
	isDone: false,
	sortOrder,
	templateId: null,
	icon: null
});

describe.each([
	['sqlite', sqliteRepositories],
	['memory', createMemoryRepositories]
])('%s repositories', (_name, create) => {
	it('stores templates and hides archived ones', () => {
		const { templates } = create();
		const rent = templates.add({
			name: 'Rent',
			defaultAmount: 100,
			minimumAmount: 50,
			dueDay: 5,
			fundFrom: 'EVERY',
			destinationId: null,
			installmentCount: null,
			installmentsCompleted: 0,
			isActive: true,
			icon: null,
			createdAt: 1
		});
		templates.add({
			name: 'Aircon',
			defaultAmount: null,
			minimumAmount: null,
			dueDay: null,
			fundFrom: 'MONTH_END',
			destinationId: null,
			installmentCount: null,
			installmentsCompleted: 0,
			isActive: true,
			icon: null,
			createdAt: 1
		});
		expect(templates.listActive().map((entry) => entry.name)).toEqual(['Aircon', 'Rent']);
		expect(templates.update(rent, { defaultAmount: 250, name: 'House rent' })).toBe(true);
		expect(templates.findById(rent)?.name).toBe('House rent');
		expect(templates.archive(rent)).toBe(true);
		expect(templates.archive(rent)).toBe(false);
		expect(templates.update(rent, { defaultAmount: 1 })).toBe(false);
		expect(templates.findById(rent)).toBeNull();
		expect(templates.listActive()).toHaveLength(1);
	});

	it('creates paydays and finds them by date', () => {
		const { paydays } = create();
		expect(paydays.listOpen()).toEqual([]);
		expect(paydays.findLatest()).toBeNull();
		const id = paydays.create(newPayday);
		expect(paydays.listOpen()[0]).toMatchObject({ id, title: 'October 15', isClosed: false });
		expect(paydays.findByScheduledDate('2026-10-15')?.id).toBe(id);
		expect(paydays.update(id, { isClosed: true, note: 'done' })).toBe(true);
		expect(paydays.update(id, {})).toBe(false);
		expect(paydays.listOpen()).toEqual([]);
		expect(paydays.listClosed()[0]).toMatchObject({ id, note: 'done' });
		expect(paydays.findById(9999)).toBeNull();
		expect(paydays.update(9999, { note: 'missing' })).toBe(false);
		expect(paydays.findByScheduledDate('1999-01-01')).toBeNull();
		expect(
			paydays.create({ ...newPayday, scheduledDate: '2026-11-15', title: 'November 15' })
		).toBeGreaterThan(id);
		expect(paydays.findLatest()?.isClosed).toBe(false);
	});

	it('updates, removes and orders route items, including the inbox', () => {
		const { paydays, items } = create();
		const paydayId = paydays.create(newPayday);
		expect(items.maxSortOrder(paydayId)).toBe(-1);
		const id = items.add(item('Rent', 4, paydayId));
		items.add(item('Water', 7, paydayId));
		const inboxId = items.add(item('Unassigned', 0, null));
		expect(items.maxSortOrder(paydayId)).toBe(7);
		expect(items.maxSortOrder(null)).toBe(0);
		expect(items.listInbox().map((entry) => entry.id)).toEqual([inboxId]);
		expect(
			items.update(id, { isDone: true, fullAmount: 5, fullAmountExpr: '0.05', decision: 'FULL' })
		).toBe(true);
		expect(items.update(id, {})).toBe(false);
		expect(items.findById(id)).toMatchObject({ isDone: true, fullAmount: 5, paydayId });
		expect(items.hasTemplate(paydayId, 9)).toBe(false);
		items.update(id, { templateId: 9 });
		expect(items.hasTemplate(paydayId, 9)).toBe(true);
		expect(items.remove(id)).toBe(true);
		expect(items.remove(id)).toBe(false);
		expect(items.findById(id)).toBeNull();
		expect(items.listByPayday(paydayId)).toHaveLength(1);
	});

	it('stores activity events newest first', () => {
		const { activity } = create();
		activity.add({
			createdAt: 10,
			action: 'add',
			paydayId: 1,
			entityType: 'item',
			entityId: 1,
			summary: 'Added older'
		});
		activity.add({
			createdAt: 20,
			action: 'finish',
			paydayId: 1,
			entityType: 'payday',
			entityId: 1,
			summary: 'Finished newer'
		});
		expect(activity.listRecent(1)).toEqual([
			expect.objectContaining({ action: 'finish', summary: 'Finished newer' })
		]);
		expect(activity.listRecent().map((event) => event.summary)).toEqual([
			'Finished newer',
			'Added older'
		]);
	});

	it('stores destinations and settings', () => {
		const { destinations, settings } = create();
		const gcash = destinations.add({ name: 'GCash', kind: 'ACCOUNT', createdAt: 1 });
		destinations.add({ name: 'Meralco', kind: 'BILLER', createdAt: 1 });
		expect(destinations.listActive().map((entry) => entry.name)).toEqual(['GCash', 'Meralco']);
		expect(destinations.findById(gcash)?.name).toBe('GCash');
		expect(destinations.findById(9999)).toBeNull();
		expect(destinations.update(gcash, { name: 'Maya' })).toBe(true);
		expect(destinations.update(gcash, {})).toBe(false);
		expect(destinations.update(9999, { name: 'Nope' })).toBe(false);
		expect(destinations.archive(gcash)).toBe(true);
		expect(destinations.archive(gcash)).toBe(false);
		expect(destinations.listActive()).toHaveLength(1);
		expect(settings.get().currency).toBe('PHP');
		settings.setCurrency('JPY');
		settings.setSalaries(7_500_000, 8_000_000);
		expect(settings.get()).toMatchObject({
			currency: 'JPY',
			midMonthSalary: 7_500_000,
			monthEndSalary: 8_000_000,
			payRule: DEFAULT_PAY_RULE
		});
		settings.setPayRule({ ...DEFAULT_PAY_RULE, shift: 'NEXT', daysOfMonth: [10, 25] });
		expect(settings.get().payRule).toMatchObject({ shift: 'NEXT', daysOfMonth: [10, 25] });
	});
});

describe('sqlite settings fallbacks', () => {
	it('falls back when settings are missing or the currency is unknown', () => {
		const handle = openDatabase(':memory:');
		migrateDatabase(handle, resolve('drizzle'));
		const { settings } = createSqliteRepositories(handle);
		handle.sqlite.exec('DELETE FROM settings');
		expect(settings.get()).toEqual({
			currency: 'PHP',
			midMonthSalary: null,
			monthEndSalary: null,
			payRule: DEFAULT_PAY_RULE
		});
		handle.sqlite.exec(
			"INSERT INTO settings (id, currency, mid_month_salary, month_end_salary) VALUES (1, 'XXX', NULL, NULL)"
		);
		expect(settings.get().currency).toBe('PHP');
		handle.close();
	});
});

describe('sqlite holidays and overrides', () => {
	it('seeds official 2026 and 2027 national holidays and stores overrides', () => {
		const handle = openDatabase(':memory:');
		migrateDatabase(handle, resolve('drizzle'));
		const { holidays, payOverrides } = createSqliteRepositories(handle);
		const rows = holidays.list();
		expect(rows).toHaveLength(OFFICIAL_NATIONAL_HOLIDAYS.length);
		expect(rows.map((row) => row.date).sort()).toEqual(
			OFFICIAL_NATIONAL_HOLIDAYS.map((row) => row.date).sort()
		);
		expect(rows.find((row) => row.date === '2026-11-30')?.name).toBe('Bonifacio Day');
		expect(rows.find((row) => row.date === '2026-02-25')).toBeUndefined();
		expect(rows.find((row) => row.date === '2027-02-06')?.name).toBe('Chinese New Year');
		const id = holidays.add({
			date: '2026-11-20',
			name: 'Local fiesta',
			kind: 'LOCAL',
			createdAt: 1
		});
		expect(holidays.findById(id)?.kind).toBe('LOCAL');
		expect(holidays.remove(id)).toBe(true);
		expect(holidays.findById(id)).toBeNull();
		expect(holidays.remove(id)).toBe(false);
		expect(payOverrides.get('2026-11-15')).toBeNull();
		payOverrides.set('2026-11-15', '2026-11-12');
		payOverrides.set('2026-11-15', '2026-11-13');
		expect(payOverrides.get('2026-11-15')).toBe('2026-11-13');
		expect(payOverrides.all()).toEqual({ '2026-11-15': '2026-11-13' });
		expect(payOverrides.remove('2026-11-15')).toBe(true);
		expect(payOverrides.get('2026-11-15')).toBeNull();
		handle.close();
	});
});
