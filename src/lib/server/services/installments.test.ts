import { describe, expect, it } from 'vitest';
import { createTestClock } from '../testing/clock.ts';
import { createMemoryRepositories } from '../testing/memory-repositories.ts';
import { createServices } from '../container.ts';

describe('fixed-N installments', () => {
	it('rejects installment plans without a default amount', () => {
		const services = createServices(
			createMemoryRepositories(),
			'test-passphrase-16c',
			createTestClock()
		);
		expect(() =>
			services.templates.add({
				name: 'Phone',
				amount: '',
				minimum: '',
				dueDay: '',
				fundFrom: 'EVERY',
				destinationId: null,
				installmentCount: '3',
				applyToOpen: false
			})
		).toThrow(/default amount/i);
	});

	it('stops spawning after N paid installments and syncs the counter', () => {
		const services = createServices(
			createMemoryRepositories(),
			'test-passphrase-16c',
			createTestClock()
		);
		services.paydays.ensureUpcoming();
		const mid = services.paydays.active()!.payday;
		const id = services.templates.add({
			name: 'Phone',
			amount: '1,000',
			minimum: '',
			dueDay: '',
			fundFrom: 'MID_MONTH',
			destinationId: null,
			installmentCount: '2',
			applyToOpen: true
		});
		const first = services.paydays.view(mid.id).items.find((item) => item.templateId === id);
		expect(first).toBeDefined();
		services.items.decide(first!.id, 'FULL');
		expect(services.items.toggleDone(first!.id)).toBe(true);
		expect(services.templates.list().find((entry) => entry.id === id)?.installmentsCompleted).toBe(
			1
		);

		services.paydays.close(mid.id);
		services.paydays.ensureUpcoming();
		const nextMid = services.paydays
			.listOpen()
			.find((payday) => payday.cadence === 'MID_MONTH' && payday.id !== mid.id)!;
		const second = services.paydays.view(nextMid.id).items.find((item) => item.templateId === id);
		expect(second).toBeDefined();
		services.items.decide(second!.id, 'FULL');
		expect(services.items.toggleDone(second!.id)).toBe(true);
		expect(services.templates.list().find((entry) => entry.id === id)?.installmentsCompleted).toBe(
			2
		);

		expect(services.items.toggleDone(second!.id)).toBe(false);
		expect(services.templates.list().find((entry) => entry.id === id)?.installmentsCompleted).toBe(
			1
		);
		expect(services.items.toggleDone(second!.id)).toBe(true);
		expect(services.templates.list().find((entry) => entry.id === id)?.installmentsCompleted).toBe(
			2
		);

		services.paydays.close(nextMid.id);
		services.paydays.ensureUpcoming();
		const thirdMid = services.paydays
			.listOpen()
			.find(
				(payday) =>
					payday.cadence === 'MID_MONTH' && payday.id !== mid.id && payday.id !== nextMid.id
			)!;
		expect(
			services.paydays.view(thirdMid.id).items.some((item) => item.templateId === id)
		).toBe(false);
	});

	it('spawns at most one EVERY installment per calendar month', () => {
		const services = createServices(
			createMemoryRepositories(),
			'test-passphrase-16c',
			createTestClock()
		);
		services.paydays.ensureUpcoming();
		const mid = services.paydays.active()!.payday;
		const end = services.paydays.listOpen().find((payday) => payday.cadence === 'MONTH_END')!;
		const id = services.templates.add({
			name: 'Appliance',
			amount: '500',
			minimum: '',
			dueDay: '',
			fundFrom: 'EVERY',
			destinationId: null,
			installmentCount: '6',
			applyToOpen: true
		});
		expect(services.paydays.view(mid.id).items.some((item) => item.templateId === id)).toBe(true);
		expect(services.paydays.view(end.id).items.some((item) => item.templateId === id)).toBe(false);
	});

	it('decrements the counter when a done installment is removed', () => {
		const services = createServices(
			createMemoryRepositories(),
			'test-passphrase-16c',
			createTestClock()
		);
		services.paydays.ensureUpcoming();
		const mid = services.paydays.active()!.payday;
		const id = services.templates.add({
			name: 'Laptop',
			amount: '2,000',
			minimum: '',
			dueDay: '',
			fundFrom: 'MID_MONTH',
			destinationId: null,
			installmentCount: '3',
			applyToOpen: true
		});
		const item = services.paydays.view(mid.id).items.find((entry) => entry.templateId === id)!;
		services.items.decide(item.id, 'FULL');
		services.items.toggleDone(item.id);
		services.items.remove(item.id);
		expect(services.templates.list().find((entry) => entry.id === id)?.installmentsCompleted).toBe(
			0
		);
	});
});
