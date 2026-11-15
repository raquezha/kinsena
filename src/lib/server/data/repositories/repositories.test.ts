import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from '../../testing/memory-repositories.ts';
import type { NewPayday, NewRouteItem, Repositories } from '../../ports.ts';
import { openDatabase } from '../database.ts';
import { migrateDatabase } from '../migrate.ts';
import { createSqliteRepositories } from './index.ts';

function sqliteRepositories(): Repositories {
	const handle = openDatabase(':memory:');
	migrateDatabase(handle, resolve('drizzle'));
	return createSqliteRepositories(handle.db);
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
	dueDate: null,
	isDone: false,
	sortOrder,
	templateId: null
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
			createdAt: 1
		});
		templates.add({
			name: 'Aircon',
			defaultAmount: null,
			minimumAmount: null,
			dueDay: null,
			fundFrom: 'MONTH_END',
			destinationId: null,
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

	it('stores destinations and settings', () => {
		const { destinations, settings } = create();
		const gcash = destinations.add({ name: 'GCash', kind: 'ACCOUNT', createdAt: 1 });
		destinations.add({ name: 'Meralco', kind: 'BILLER', createdAt: 1 });
		expect(destinations.listActive().map((entry) => entry.name)).toEqual(['GCash', 'Meralco']);
		expect(destinations.update(gcash, { name: 'Maya' })).toBe(true);
		expect(destinations.archive(gcash)).toBe(true);
		expect(destinations.archive(gcash)).toBe(false);
		expect(destinations.listActive()).toHaveLength(1);
		expect(settings.get().currency).toBe('PHP');
		settings.setCurrency('JPY');
		settings.setSalaries(7_500_000, 8_000_000);
		expect(settings.get()).toMatchObject({
			currency: 'JPY',
			midMonthSalary: 7_500_000,
			monthEndSalary: 8_000_000
		});
	});
});
