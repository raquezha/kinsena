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

describe('database migration', () => {
	it('creates a fresh schema with default settings', () => {
		const { handle, repos } = openMigrated(':memory:');
		expect(repos.settings.getCurrency()).toBe('PHP');
		expect(repos.templates.listActive()).toEqual([]);
		handle.close();
	});

	it('creates the parent folder for a new database file', () => {
		const dir = mkdtempSync(join(tmpdir(), 'kinsena-dir-'));
		const { handle, repos } = openMigrated(join(dir, 'nested', 'kinsena.db'));
		expect(repos.cycles.findOpen()).toBeNull();
		handle.close();
	});

	it('adopts a Kinsena 0.1 database without losing data', () => {
		const path = fixtureDb(KINSENA_0_1_SCHEMA);
		for (let run = 0; run < 2; run++) {
			const { handle, repos } = openMigrated(path);
			expect(repos.settings.getCurrency()).toBe('USD');
			expect(repos.templates.listActive()).toEqual([
				{ id: 1, name: 'Rent', defaultAmount: 1_850_050, cadence: 'ANY' }
			]);
			const [closed] = repos.cycles.listClosed();
			expect(closed).toMatchObject({ title: 'September 30', note: 'Bonus payout' });
			expect(repos.items.listByCycle(1)[0]).toMatchObject({ amount: 1_850_050, isDone: true });
			expect(repos.cycles.findOpen()?.title).toBe('October 15');
			handle.close();
		}
	});

	it('upgrades REAL peso columns to integer centavos exactly once', () => {
		const path = fixtureDb(LEGACY_REAL_SCHEMA);
		for (let run = 0; run < 2; run++) {
			const { handle, repos } = openMigrated(path);
			const [rent, variable] = repos.templates.listActive();
			expect(rent?.defaultAmount).toBe(1_850_050);
			expect(variable?.defaultAmount).toBeNull();
			const cycle = repos.cycles.findOpen();
			expect(cycle?.salary).toBe(7_500_000);
			const items = repos.items.listByCycle(cycle?.id ?? 0);
			expect(items[0]?.amount).toBe(1_850_050);
			expect(summarize({ salary: cycle?.salary ?? null }, items).leftover).toBe(5_649_950);
			for (const [table, column] of [
				['template_items', 'default_amount'],
				['cycles', 'salary'],
				['cycle_items', 'amount']
			] as const) {
				expect(isFloatingColumn(handle.sqlite, table, column)).toBe(false);
			}
			handle.close();
		}
	});
});
