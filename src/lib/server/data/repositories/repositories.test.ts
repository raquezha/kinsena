import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from '../../testing/memory-repositories.ts';
import type { NewCycleItem, Repositories } from '../../ports.ts';
import { openDatabase } from '../database.ts';
import { migrateDatabase } from '../migrate.ts';
import { createSqliteRepositories } from './index.ts';

function sqliteRepositories(): Repositories {
	const handle = openDatabase(':memory:');
	migrateDatabase(handle, resolve('drizzle'));
	return createSqliteRepositories(handle.db);
}

const item = (name: string, sortOrder: number): NewCycleItem => ({
	name,
	amount: 100,
	amountExpr: '1',
	isDone: false,
	sortOrder
});

const newCycle = { title: 'Payday', date: '2026-10-15', salary: null, note: null, createdAt: 1 };

// The in-memory fakes used by service tests must behave like SQLite.
describe.each([
	['sqlite', sqliteRepositories],
	['memory', createMemoryRepositories]
])('%s repositories', (_name, create) => {
	it('stores templates and hides archived ones', () => {
		const { templates } = create();
		const rent = templates.add({ name: 'Rent', defaultAmount: 100, cadence: 'ANY', createdAt: 1 });
		templates.add({ name: 'Aircon', defaultAmount: null, cadence: 'MONTH_END', createdAt: 1 });
		expect(templates.listActive().map((entry) => entry.name)).toEqual(['Aircon', 'Rent']);
		expect(templates.updateAmount(rent, 250)).toBe(true);
		expect(templates.archive(rent)).toBe(true);
		expect(templates.archive(rent)).toBe(false);
		expect(templates.updateAmount(rent, 1)).toBe(false);
		expect(templates.listActive()).toHaveLength(1);
	});

	it('creates cycles with items and finds the open one', () => {
		const { cycles, items } = create();
		expect(cycles.findOpen()).toBeNull();
		expect(cycles.findLatest()).toBeNull();
		const id = cycles.create(newCycle, [item('B', 1), item('A', 0)]);
		expect(cycles.findOpen()).toMatchObject({ id, title: 'Payday', isClosed: false });
		expect(items.listByCycle(id).map((entry) => entry.name)).toEqual(['A', 'B']);
		expect(cycles.update(id, { isClosed: true, note: 'done' })).toBe(true);
		expect(cycles.update(id, {})).toBe(false);
		expect(cycles.findOpen()).toBeNull();
		expect(cycles.listClosed()[0]).toMatchObject({ id, note: 'done' });
		expect(cycles.findById(9999)).toBeNull();
		expect(cycles.create(newCycle, [])).toBeGreaterThan(id);
		expect(cycles.findLatest()?.isClosed).toBe(false);
	});

	it('updates, removes and orders items', () => {
		const { cycles, items } = create();
		const cycleId = cycles.create(newCycle, []);
		expect(items.maxSortOrder(cycleId)).toBe(-1);
		const id = items.add(cycleId, item('Rent', 4));
		items.add(cycleId, item('Water', 7));
		expect(items.maxSortOrder(cycleId)).toBe(7);
		expect(items.update(id, { isDone: true, amount: 5, amountExpr: '0.05' })).toBe(true);
		expect(items.update(id, {})).toBe(false);
		expect(items.findById(id)).toMatchObject({ isDone: true, amount: 5, cycleId });
		expect(items.remove(id)).toBe(true);
		expect(items.remove(id)).toBe(false);
		expect(items.findById(id)).toBeNull();
		expect(items.removeByCycle(cycleId)).toBe(1);
		expect(items.listByCycle(cycleId)).toEqual([]);
	});

	it('remembers the currency', () => {
		const { settings } = create();
		expect(settings.getCurrency()).toBe('PHP');
		settings.setCurrency('JPY');
		expect(settings.getCurrency()).toBe('JPY');
	});
});
