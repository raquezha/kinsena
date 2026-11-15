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
});

describe('template, destination and settings services', () => {
	it('saves destinations and default salaries', () => {
		const services = createServices(
			createMemoryRepositories(),
			'test-passphrase-16c',
			createTestClock()
		);
		const gcash = services.destinations.add('GCash', 'ACCOUNT');
		services.destinations.update(gcash, 'Maya', 'ACCOUNT');
		expect(services.destinations.list()).toEqual([{ id: gcash, name: 'Maya', kind: 'ACCOUNT' }]);
		services.destinations.archive(gcash);
		expect(services.destinations.list()).toEqual([]);
		services.settings.setSalaries('75,000', '');
		expect(services.settings.get()).toMatchObject({
			midMonthSalary: 7_500_000,
			monthEndSalary: null
		});
		const id = services.templates.add({
			name: 'Savings',
			amount: '5,000',
			minimum: '',
			dueDay: '31',
			fundFrom: 'MONTH_END',
			destinationId: null
		});
		services.paydays.ensureUpcoming();
		const end = services.paydays.listOpen().find((payday) => payday.cadence === 'MONTH_END')!;
		expect(services.paydays.view(end.id).items[0]?.name).toBe('Savings');
		services.templates.update(id, {
			name: 'Savings transfer',
			amount: '6,000',
			minimum: '',
			dueDay: '31',
			fundFrom: 'MONTH_END',
			destinationId: null
		});
		expect(services.templates.list()[0]?.name).toBe('Savings transfer');
		services.templates.archive(id);
		expect(services.templates.list()).toEqual([]);
		expect(() =>
			services.templates.update(id, {
				name: 'Gone',
				amount: '1',
				minimum: '',
				dueDay: '',
				fundFrom: 'EVERY',
				destinationId: null
			})
		).toThrow('Unknown saved item');
		services.settings.setCurrency('USD');
		expect(services.settings.currency()).toBe('USD');
		expect(() =>
			services.templates.add({
				name: 'Bad day',
				amount: '',
				minimum: '',
				dueDay: 'mid',
				fundFrom: 'EVERY',
				destinationId: null
			})
		).toThrow('Due day must be between 1 and 31');
	});
});
