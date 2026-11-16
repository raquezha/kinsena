import { beforeEach, describe, expect, it } from 'vitest';
import { DomainError } from '../../domain/errors.ts';
import { skipPastDueWarning } from '../../domain/summary.ts';
import { createTestClock } from '../testing/clock.ts';
import { createMemoryRepositories } from '../testing/memory-repositories.ts';
import { createServices, type Services } from '../container.ts';

describe('route service', () => {
	let services: Services;
	let paydayId: number;

	beforeEach(() => {
		services = createServices(createMemoryRepositories(), 'test-passphrase-16c', createTestClock());
		services.paydays.ensureUpcoming();
		paydayId = services.paydays.active()!.payday.id;
	});

	it('adds items, decides how to route them, and marks them done', () => {
		const rent = services.items.add({
			paydayId,
			name: 'Rent',
			amount: '18,500.50',
			minimum: '5,000',
			dueDate: '2026-10-20',
			destinationId: null
		});
		const card = services.items.add({
			paydayId,
			name: 'Card',
			amount: '10,538.91 + 3403',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		services.items.decide(rent, 'FULL');
		services.items.decide(card, 'CUSTOM', '2,000');
		expect(services.paydays.view(paydayId).items.find((item) => item.id === rent)).toMatchObject({
			decision: 'FULL',
			chosenAmount: 1_850_050
		});
		expect(
			services.paydays.view(paydayId).items.find((item) => item.id === card)?.chosenAmount
		).toBe(200_000);
		expect(services.items.toggleDone(rent)).toBe(true);
		expect(services.paydays.view(paydayId).summary.routed).toBe(1_850_050);
		expect(services.items.toggleDone(rent)).toBe(false);
		expect(() => services.items.decide(card, 'MINIMUM')).toThrow('Set a minimum amount first');
		const blank = services.items.add({
			paydayId,
			name: 'Unknown',
			amount: '',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		expect(() => services.items.decide(blank, 'FULL')).toThrow('Set the full amount first');
		expect(() => services.items.toggleDone(blank)).toThrow('Choose how to route this item first');
		services.items.decide(rent, 'MINIMUM');
		expect(
			services.paydays.view(paydayId).items.find((item) => item.id === rent)?.chosenAmount
		).toBe(500_000);
		services.items.decide(rent, 'PENDING');
		expect(services.paydays.view(paydayId).items.find((item) => item.id === rent)?.decision).toBe(
			'PENDING'
		);
		expect(() => services.items.decide(card, 'CUSTOM', '')).toThrow('Enter a custom amount');
		expect(() => services.items.decide(rent, 'SKIPPED')).toThrow('Use skip to skip an item');
	});

	it('skips in place or moves the item to the next payday', () => {
		const bill = services.items.add({
			paydayId,
			name: 'Card statement',
			amount: '4,000',
			minimum: '1,000',
			dueDate: '2026-10-20',
			destinationId: null
		});
		const next = services.paydays.nextAfter(paydayId);
		expect(skipPastDueWarning('2026-10-20', next.scheduledDate)).toMatch(/before the next payday/);
		services.items.skip(bill, false);
		expect(services.paydays.view(paydayId).items.find((item) => item.id === bill)?.decision).toBe(
			'SKIPPED'
		);
		services.items.skip(bill, true);
		expect(services.paydays.view(paydayId).items.find((item) => item.id === bill)).toBeUndefined();
		expect(services.paydays.view(next.id).items.find((item) => item.id === bill)).toMatchObject({
			name: 'Card statement',
			decision: 'PENDING',
			paydayId: next.id
		});
	});

	it('removes and restores an item, and updates its details', () => {
		const id = services.items.add({
			paydayId,
			name: 'Water',
			amount: '500',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		services.items.update(id, {
			name: 'Water bill',
			amount: '600',
			minimum: '100',
			dueDate: '2026-10-25',
			destinationId: null
		});
		expect(services.paydays.view(paydayId).items[0]).toMatchObject({
			name: 'Water bill',
			fullAmount: 60_000,
			minimumAmount: 10_000,
			dueDate: '2026-10-25'
		});
		const removed = services.items.remove(id);
		expect(services.paydays.view(paydayId).items).toEqual([]);
		const restored = services.items.restore(removed);
		expect(services.paydays.view(paydayId).items[0]).toMatchObject({
			id: restored,
			name: 'Water bill',
			fullAmount: 60_000
		});
		expect(() =>
			services.items.add({
				paydayId,
				name: '',
				amount: '',
				minimum: '',
				dueDate: '',
				destinationId: null
			})
		).toThrow(DomainError);
	});

	it('assigns inbox items to a payday', () => {
		const id = services.items.add({
			paydayId: null,
			name: 'Inbox bill',
			amount: '100',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		services.items.assign(id, paydayId);
		expect(services.paydays.view(paydayId).items[0]?.name).toBe('Inbox bill');
	});

	it('reorders open items by manual rank and rejects done or skipped ids', () => {
		const first = services.items.add({
			paydayId,
			name: 'First',
			amount: '100',
			minimum: '',
			dueDate: '2026-11-01',
			destinationId: null
		});
		const second = services.items.add({
			paydayId,
			name: 'Second',
			amount: '100',
			minimum: '',
			dueDate: '2026-10-01',
			destinationId: null
		});
		services.items.reorder(paydayId, [second, first]);
		expect(services.paydays.view(paydayId).items.map((item) => item.id)).toEqual([second, first]);

		services.items.decide(first, 'FULL');
		services.items.toggleDone(first);
		expect(() => services.items.reorder(paydayId, [first])).toThrow(/open items/i);

		services.items.skip(second, false);
		const third = services.items.add({
			paydayId,
			name: 'Third',
			amount: '50',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		services.items.reorder(paydayId, [third]);
		expect(services.paydays.view(paydayId).items.find((item) => item.id === third)?.sortOrder).toBe(
			0
		);
	});

	it('keeps done and skipped buckets after open reorder and survives reload shape', () => {
		const a = services.items.add({
			paydayId,
			name: 'A',
			amount: '10',
			minimum: '',
			dueDate: '2026-12-01',
			destinationId: null
		});
		const b = services.items.add({
			paydayId,
			name: 'B',
			amount: '10',
			minimum: '',
			dueDate: '2026-11-01',
			destinationId: null
		});
		const c = services.items.add({
			paydayId,
			name: 'C',
			amount: '10',
			minimum: '',
			dueDate: '2026-10-01',
			destinationId: null
		});
		services.items.decide(c, 'FULL');
		services.items.toggleDone(c);
		services.items.skip(b, false);

		services.items.reorder(paydayId, [a]);
		const view = services.paydays.view(paydayId);
		expect(view.items.map((item) => item.id)).toEqual([a, c, b]);
		expect(view.items.find((item) => item.id === a)?.sortOrder).toBe(0);
	});

	it('rejects stale, duplicate, and closed-payday reorder payloads', () => {
		const a = services.items.add({
			paydayId,
			name: 'A',
			amount: '10',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		const b = services.items.add({
			paydayId,
			name: 'B',
			amount: '10',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		expect(() => services.items.reorder(paydayId, [a])).toThrow(/out of date/i);
		expect(() => services.items.reorder(paydayId, [a, a])).toThrow(/out of date/i);
		expect(() => services.items.reorder(paydayId, [a, 999])).toThrow(/open items/i);
		services.items.reorder(paydayId, [b, a]);
		expect(services.paydays.view(paydayId).items.map((item) => item.id)).toEqual([b, a]);

		services.paydays.receive(paydayId, '50,000');
		services.paydays.close(paydayId);
		expect(() => services.items.reorder(paydayId, [b, a])).toThrow();
	});

	it('no-op reorder is idempotent', () => {
		const a = services.items.add({
			paydayId,
			name: 'A',
			amount: '10',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		const b = services.items.add({
			paydayId,
			name: 'B',
			amount: '10',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		const before = services.paydays.view(paydayId).items.map((item) => item.id);
		services.items.reorder(paydayId, [a, b]);
		expect(services.paydays.view(paydayId).items.map((item) => item.id)).toEqual(before);
		services.items.reorder(paydayId, [a, b]);
		expect(services.paydays.view(paydayId).items.map((item) => item.id)).toEqual(before);
	});
});

