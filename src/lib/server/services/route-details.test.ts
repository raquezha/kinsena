import { beforeEach, describe, expect, it } from 'vitest';
import { createTestClock } from '../testing/clock.ts';
import { createMemoryRepositories } from '../testing/memory-repositories.ts';
import { createServices, type Services } from '../container.ts';

describe('route service details', () => {
	let services: Services;
	let paydayId: number;

	beforeEach(() => {
		services = createServices(createMemoryRepositories(), 'test-passphrase-16c', createTestClock());
		services.paydays.ensureUpcoming();
		paydayId = services.paydays.active()!.payday.id;
	});

	it('recalculates the chosen amount when item details change', () => {
		const full = services.items.add({
			paydayId,
			name: 'Full bill',
			amount: '1,000',
			minimum: '100',
			dueDate: '',
			destinationId: null
		});
		services.items.decide(full, 'FULL');
		services.items.update(full, {
			name: 'Full bill',
			amount: '1,500',
			minimum: '100',
			dueDate: '',
			destinationId: null
		});
		expect(services.paydays.view(paydayId).items.find((item) => item.id === full)).toMatchObject({
			chosenAmount: 150_000,
			fullAmount: 150_000
		});

		const min = services.items.add({
			paydayId,
			name: 'Min bill',
			amount: '1,000',
			minimum: '200',
			dueDate: '',
			destinationId: null
		});
		services.items.decide(min, 'MINIMUM');
		services.items.update(min, {
			name: 'Min bill',
			amount: '1,000',
			minimum: '300',
			dueDate: '',
			destinationId: null
		});
		expect(
			services.paydays.view(paydayId).items.find((item) => item.id === min)?.chosenAmount
		).toBe(30_000);
		expect(() =>
			services.items.update(min, {
				name: 'Min bill',
				amount: '1,000',
				minimum: '',
				dueDate: '',
				destinationId: null
			})
		).toThrow('Set a minimum amount first');

		const pending = services.items.add({
			paydayId,
			name: 'Pending bill',
			amount: '400',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		services.items.update(pending, {
			name: 'Pending bill',
			amount: '450',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		expect(services.paydays.view(paydayId).items.find((item) => item.id === pending)).toMatchObject(
			{ decision: 'PENDING', chosenAmount: 0, fullAmount: 45_000 }
		);

		const skipped = services.items.add({
			paydayId,
			name: 'Skipped bill',
			amount: '200',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		services.items.skip(skipped, false);
		services.items.update(skipped, {
			name: 'Skipped bill',
			amount: '250',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		expect(services.paydays.view(paydayId).items.find((item) => item.id === skipped)).toMatchObject(
			{ decision: 'SKIPPED', chosenAmount: 0, fullAmount: 25_000 }
		);
	});

	it('returns an assigned item to the inbox and restores a blank amount', () => {
		const id = services.items.add({
			paydayId,
			name: 'Later',
			amount: '80',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		services.items.assign(id, null);
		expect(services.paydays.view(paydayId).items.find((item) => item.id === id)).toBeUndefined();
		const removed = services.items.remove(id);
		const restored = services.items.restore({ ...removed, fullAmountExpr: null });
		expect(restored).toBeGreaterThan(0);
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

		const undated = services.templates.add({
			name: 'No due day',
			amount: '10',
			minimum: '',
			dueDay: undefined as unknown as string,
			fundFrom: 'EVERY',
			destinationId: null
		});
		expect(
			services.templates.list().some((entry) => entry.id === undated && entry.dueDay === null)
		).toBe(true);
		services.templates.archive(undated);
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
