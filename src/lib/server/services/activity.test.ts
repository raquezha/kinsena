import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACTIVITY_ACTIONS } from '../../domain/activity.ts';
import { createServices } from '../container.ts';
import { openDatabase } from '../data/database.ts';
import { migrateDatabase } from '../data/migrate.ts';
import { createSqliteRepositories } from '../data/repositories/index.ts';
import { createTestClock } from '../testing/clock.ts';
import { createMemoryRepositories } from '../testing/memory-repositories.ts';

function memoryServices(clock = createTestClock()) {
	return createServices(createMemoryRepositories(), 'test-passphrase-16c', clock);
}

function sqliteServices() {
	const handle = openDatabase(':memory:');
	migrateDatabase(handle, resolve('drizzle'));
	const repos = createSqliteRepositories(handle);
	const services = createServices(repos, 'test-passphrase-16c', createTestClock());
	return { handle, repos, services };
}

describe('activity feed', () => {
	it('emits the six logged actions and nothing for set-note', () => {
		const services = memoryServices();
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
		expect(
			activity.every((event) => (ACTIVITY_ACTIONS as readonly string[]).includes(event.action))
		).toBe(true);
		expect(activity.some((event) => /note|Bonus|Should not/i.test(event.summary))).toBe(false);
		expect(activity.find((event) => event.action === 'finish')?.summary).toMatch(/^Finished /);
		expect(activity.find((event) => event.action === 'decide')?.summary).toBe(
			'Chose full for Rent'
		);
	});

	it('does not emit for receive, reorder, plan approve, restore, reopen, update, or archive', () => {
		const services = memoryServices();
		services.paydays.ensureUpcoming();
		const paydayId = services.paydays.active()!.payday.id;
		const a = services.items.add({
			paydayId,
			name: 'A',
			amount: '100',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		const b = services.items.add({
			paydayId,
			name: 'B',
			amount: '200',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		const setupIds = new Set(services.paydays.history().activity.map((event) => event.id));

		services.paydays.receive(paydayId, '50,000');
		services.items.reorder(paydayId, [b, a]);
		services.items.update(a, {
			name: 'A renamed',
			amount: '150',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		services.plans.approve(paydayId, [
			{ itemId: a, decision: 'FULL', amount: 15_000, reason: '' },
			{ itemId: b, decision: 'SKIPPED', amount: 0, reason: 'cut' }
		]);
		const removed = services.items.remove(b);
		services.items.restore(removed);
		services.paydays.close(paydayId);
		services.paydays.reopen(paydayId);
		const templateId = services.templates.add({
			name: 'Temp',
			amount: '1,000',
			minimum: '',
			dueDay: '',
			fundFrom: 'EVERY',
			destinationId: null,
			installmentCount: '',
			applyToOpen: false
		});
		services.templates.archive(templateId);

		const fresh = services.paydays.history().activity.filter((event) => !setupIds.has(event.id));
		expect(fresh.map((event) => event.action)).toEqual(['finish', 'remove']);
		expect(
			fresh.some((event) => /renamed|receive|archive|reopen|approve|cut/i.test(event.summary))
		).toBe(false);
		expect(services.paydays.view(paydayId).items.find((item) => item.id === a)?.name).toBe(
			'A renamed'
		);
	});

	it('does not emit when decide, toggle, or skip fail', () => {
		const services = memoryServices();
		services.paydays.ensureUpcoming();
		const paydayId = services.paydays.active()!.payday.id;
		const blank = services.items.add({
			paydayId,
			name: 'Blank',
			amount: '',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		const inbox = services.items.add({
			paydayId: null,
			name: 'Inbox',
			amount: '10',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		const before = services.paydays.history().activity.length;

		expect(() => services.items.decide(blank, 'FULL')).toThrow('Set the full amount first');
		expect(() => services.items.toggleDone(blank)).toThrow('Set the full amount first');
		expect(() => services.items.decide(blank, 'SKIPPED')).toThrow('Use skip to skip an item');
		expect(() => services.items.skip(inbox, true)).toThrow('Assign this item to a payday first');
		expect(() => services.items.decide(999, 'FULL')).toThrow();

		expect(services.paydays.history().activity).toHaveLength(before);
		expect(services.paydays.history().activity.every((event) => event.action === 'add')).toBe(true);
	});

	it('records decide variants, skip-to-next, inbox add, and finish re-close', () => {
		const clock = createTestClock();
		const services = memoryServices(clock);
		services.paydays.ensureUpcoming();
		const paydayId = services.paydays.active()!.payday.id;
		const nextId = services.paydays.nextAfter(paydayId).id;

		const rent = services.items.add({
			paydayId,
			name: 'Rent',
			amount: '10,000',
			minimum: '1,000',
			dueDate: '',
			destinationId: null
		});
		services.items.decide(rent, 'MINIMUM');
		clock.advance(1_000);
		services.items.decide(rent, 'CUSTOM', '2,500');
		clock.advance(1_000);
		services.items.decide(rent, 'PENDING');
		clock.advance(1_000);
		services.items.decide(rent, 'FULL');
		clock.advance(1_000);
		services.items.skip(rent, true);
		const inbox = services.items.add({
			paydayId: null,
			name: 'Loose',
			amount: '50',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		services.paydays.close(paydayId);
		services.paydays.reopen(paydayId);
		services.paydays.close(paydayId);

		const { activity } = services.paydays.history();
		expect(
			activity.filter((event) => event.action === 'decide').map((event) => event.summary)
		).toEqual([
			'Chose full for Rent',
			'Cleared decision for Rent',
			'Chose custom for Rent',
			'Chose minimum for Rent'
		]);
		expect(activity.find((event) => event.action === 'skip')).toMatchObject({
			summary: 'Moved Rent to next payday',
			paydayId,
			entityType: 'item',
			entityId: rent
		});
		expect(services.paydays.view(nextId).items.some((item) => item.id === rent)).toBe(true);
		expect(activity.find((event) => event.entityId === inbox)).toMatchObject({
			action: 'add',
			paydayId: null,
			summary: 'Added Loose'
		});
		expect(activity.filter((event) => event.action === 'finish')).toHaveLength(2);
		expect(activity[0]?.createdAt).toBeGreaterThanOrEqual(activity[1]?.createdAt ?? 0);
	});

	it('orders newest first and caps listRecent', () => {
		const repos = createMemoryRepositories();
		for (let i = 0; i < 60; i++) {
			repos.activity.add({
				createdAt: 1_000 + i,
				action: 'add',
				paydayId: 1,
				entityType: 'item',
				entityId: i,
				summary: `Added ${i}`
			});
		}
		const recent = repos.activity.listRecent(50);
		expect(recent).toHaveLength(50);
		expect(recent[0]?.summary).toBe('Added 59');
		expect(recent[49]?.summary).toBe('Added 10');
		expect(repos.activity.listRecent(3).map((event) => event.summary)).toEqual([
			'Added 59',
			'Added 58',
			'Added 57'
		]);
	});

	it('rolls back mutations when the activity insert fails in SQLite', () => {
		const { handle, repos, services } = sqliteServices();
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
		const original = repos.activity.add.bind(repos.activity);
		const boom = () => {
			throw new Error('activity write failed');
		};

		repos.activity.add = boom;
		expect(() => services.items.decide(id, 'FULL')).toThrow('activity write failed');
		expect(repos.items.findById(id)?.decision).toBe('PENDING');

		repos.activity.add = original;
		services.items.decide(id, 'FULL');
		repos.activity.add = boom;
		expect(() => services.items.toggleDone(id)).toThrow('activity write failed');
		expect(repos.items.findById(id)?.isDone).toBe(false);

		expect(() => services.items.skip(id, false)).toThrow('activity write failed');
		expect(repos.items.findById(id)?.decision).toBe('FULL');

		expect(() =>
			services.items.add({
				paydayId,
				name: 'Fail',
				amount: '1',
				minimum: '',
				dueDate: '',
				destinationId: null
			})
		).toThrow('activity write failed');
		expect(repos.items.listByPayday(paydayId).some((item) => item.name === 'Fail')).toBe(false);

		expect(() => services.items.remove(id)).toThrow('activity write failed');
		expect(repos.items.findById(id)).not.toBeNull();

		expect(() => services.paydays.close(paydayId)).toThrow('activity write failed');
		expect(repos.paydays.findById(paydayId)?.isClosed).toBe(false);

		expect(repos.activity.listRecent().map((event) => event.action)).toEqual(['decide', 'add']);
		repos.activity.add = original;
		handle.close();
	});

	it('keeps SQLite mutation and event atomic on success', () => {
		const { handle, repos, services } = sqliteServices();
		services.paydays.ensureUpcoming();
		const paydayId = services.paydays.active()!.payday.id;
		const id = services.items.add({
			paydayId,
			name: 'Power',
			amount: '900',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		services.items.decide(id, 'FULL');
		services.items.toggleDone(id);
		services.paydays.close(paydayId);

		expect(repos.items.findById(id)).toMatchObject({ decision: 'FULL', isDone: true });
		expect(repos.paydays.findById(paydayId)?.isClosed).toBe(true);
		expect(repos.activity.listRecent().map((event) => event.action)).toEqual([
			'finish',
			'toggle_done',
			'decide',
			'add'
		]);
		handle.close();
	});
});
