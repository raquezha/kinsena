import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { createSqliteRepositories } from './repositories/index.ts';
import { openDatabase } from './database.ts';
import { KINSENA_0_1_SCHEMA, LEGACY_REAL_SCHEMA } from './fixtures/legacy-schemas.ts';
import { isFloatingColumn } from './legacy-money.ts';
import { migrateDatabase } from './migrate.ts';
import { summarize } from '../../domain/summary.ts';

const MIGRATIONS = resolve('drizzle');

function fixtureDb(schemaSql: string): string {
	const path = join(mkdtempSync(join(tmpdir(), 'kinsena-migrate-')), 'kinsena.db');
	const sqlite = new Database(path);
	sqlite.exec(schemaSql);
	sqlite.close();
	return path;
}

function openMigrated(path: string) {
	const handle = openDatabase(path);
	migrateDatabase(handle, MIGRATIONS);
	return { handle, repos: createSqliteRepositories(handle.db) };
}

function tableExists(handle: ReturnType<typeof openDatabase>, name: string): boolean {
	const row = handle.sqlite
		.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
		.get(name) as { name: string } | undefined;
	return row !== undefined;
}

describe('database migration', () => {
	it('creates a fresh schema with default settings', () => {
		const { handle, repos } = openMigrated(':memory:');
		expect(repos.settings.get().currency).toBe('PHP');
		expect(repos.settings.get().midMonthSalary).toBeNull();
		expect(repos.templates.listActive()).toEqual([]);
		expect(repos.paydays.listOpen()).toEqual([]);
		expect(tableExists(handle, 'paydays')).toBe(true);
		expect(tableExists(handle, 'cycles')).toBe(false);
		handle.close();
	});

	it('creates the parent folder for a new database file', () => {
		const dir = mkdtempSync(join(tmpdir(), 'kinsena-dir-'));
		const { handle, repos } = openMigrated(join(dir, 'nested', 'kinsena.db'));
		expect(repos.paydays.listOpen()).toEqual([]);
		handle.close();
	});

	it('adopts a Kinsena 0.1 database without losing data', () => {
		const path = fixtureDb(KINSENA_0_1_SCHEMA);
		for (let run = 0; run < 2; run++) {
			const { handle, repos } = openMigrated(path);
			expect(repos.settings.get().currency).toBe('USD');
			expect(repos.templates.listActive()).toEqual([
				{
					id: 1,
					name: 'Rent',
					defaultAmount: 1_850_050,
					minimumAmount: null,
					dueDay: null,
					fundFrom: 'EVERY',
					destinationId: null,
					installmentCount: null,
					installmentsCompleted: 0
				}
			]);
			const [closed] = repos.paydays.listClosed();
			expect(closed).toMatchObject({
				title: 'September 30',
				note: 'Bonus payout',
				cadence: 'MONTH_END',
				scheduledDate: '2026-09-30',
				expectedAmount: 7_500_000,
				receivedAmount: 7_500_000,
				receivedAt: '2026-09-30'
			});
			expect(repos.items.listByPayday(1)[0]).toMatchObject({
				fullAmount: 1_850_050,
				isDone: true,
				decision: 'FULL',
				chosenAmount: 1_850_050
			});
			const open = repos.paydays.listOpen()[0];
			expect(open).toMatchObject({
				title: 'October 15',
				cadence: 'MID_MONTH',
				receivedAt: null,
				expectedAmount: null
			});
			expect(repos.items.listByPayday(open?.id ?? 0)[0]).toMatchObject({
				name: 'Electric',
				decision: 'PENDING',
				fullAmountExpr: ''
			});
			expect(tableExists(handle, 'cycles')).toBe(false);
			expect(tableExists(handle, 'route_items')).toBe(true);
			const index = handle.sqlite
				.prepare(
					"SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'route_items_payday_id_idx'"
				)
				.get() as { name: string } | undefined;
			expect(index?.name).toBe('route_items_payday_id_idx');
			handle.close();
		}
	});

	it('upgrades REAL peso columns to integer centavos then moves them to paydays', () => {
		const path = fixtureDb(LEGACY_REAL_SCHEMA);
		for (let run = 0; run < 2; run++) {
			const { handle, repos } = openMigrated(path);
			const [rent, variable] = repos.templates.listActive();
			expect(rent?.defaultAmount).toBe(1_850_050);
			expect(variable?.defaultAmount).toBeNull();
			const payday = repos.paydays.listOpen()[0];
			expect(payday?.expectedAmount).toBe(7_500_000);
			expect(payday?.receivedAmount).toBe(7_500_000);
			expect(payday?.receivedAt).toBe('2026-10-15');
			const items = repos.items.listByPayday(payday?.id ?? 0);
			expect(items[0]?.fullAmount).toBe(1_850_050);
			expect(items[0]?.decision).toBe('PENDING');
			expect(summarize(payday!, items).salary).toBe(7_500_000);
			expect(isFloatingColumn(handle.sqlite, 'template_items', 'default_amount')).toBe(false);
			expect(isFloatingColumn(handle.sqlite, 'paydays', 'expected_amount')).toBe(false);
			expect(isFloatingColumn(handle.sqlite, 'route_items', 'full_amount')).toBe(false);
			handle.close();
		}
	});
});
