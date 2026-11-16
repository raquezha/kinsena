import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createServices } from '../container.ts';
import { openDatabase } from '../data/database.ts';
import { migrateDatabase } from '../data/migrate.ts';
import { createSqliteRepositories } from '../data/repositories/index.ts';
import { createTestClock } from '../testing/clock.ts';
import { createMemoryRepositories } from '../testing/memory-repositories.ts';

describe('activity feed', () => {
	it('emits the six logged actions and nothing for set-note', () => {
		const services = createServices(
			createMemoryRepositories(),
			'test-passphrase-16c',
			createTestClock()
		);
		services.paydays.ensureUpcoming();
		const paydayId = services.paydays.active()!.payday.id;

		const rent = services.items.add({
			paydayId,
			name: 'Rent',
			amount: '10,000',
			minimum: '2,000',
			dueDate: '',
			destinationId: null
		});
		services.items.decide(rent, 'FULL');
		services.items.toggleDone(rent);
		services.items.toggleDone(rent);
		services.items.skip(rent, false);
		const water = services.items.add({
			paydayId,
			name: 'Water',
			amount: '500',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		services.items.remove(water);
		services.paydays.setNote(paydayId, 'Should not appear');
		services.paydays.close(paydayId);

		const { activity } = services.paydays.history();
		expect(activity.map((event) => event.action)).toEqual([
			'finish',
			'remove',
			'add',
			'skip',
			'toggle_done',
			'toggle_done',
			'decide',
			'add'
		]);
		expect(activity.some((event) => /note|Bonus|Should not/i.test(event.summary))).toBe(false);
		expect(activity.find((event) => event.action === 'finish')?.summary).toMatch(/^Finished /);
		expect(activity.find((event) => event.action === 'decide')?.summary).toBe('Chose full for Rent');
	});

	it('rolls back the mutation when the activity insert fails in SQLite', () => {
		const handle = openDatabase(':memory:');
		migrateDatabase(handle, resolve('drizzle'));
		const repos = createSqliteRepositories(handle);
		const services = createServices(repos, 'test-passphrase-16c', createTestClock());
		services.paydays.ensureUpcoming();
		const paydayId = services.paydays.active()!.payday.id;
		const id = services.items.add({
			paydayId,
			name: 'Gas',
			amount: '1,000',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		const before = repos.activity.listRecent().length;
		const original = repos.activity.add.bind(repos.activity);
		repos.activity.add = () => {
			throw new Error('activity write failed');
		};
		expect(() => services.items.decide(id, 'FULL')).toThrow('activity write failed');
		expect(repos.items.findById(id)?.decision).toBe('PENDING');
		expect(repos.activity.listRecent()).toHaveLength(before);
		repos.activity.add = original;
		handle.close();
	});
});
