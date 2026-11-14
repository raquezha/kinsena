import { beforeEach, describe, expect, it } from 'vitest';
import { DomainError } from '../../domain/errors.ts';
import { createTestClock } from '../testing/clock.ts';
import { createMemoryRepositories } from '../testing/memory-repositories.ts';
import type { Repositories } from '../ports.ts';
import { createCycleService, type CycleService } from './cycle-service.ts';
import { createTemplateService } from './template-service.ts';

describe('cycle service', () => {
	let repos: Repositories;
	let cycles: CycleService;

	const start = (title = 'October 15', salary = '') =>
		cycles.start({ title, cadence: 'ANY', salary });

	beforeEach(() => {
		const clock = createTestClock();
		repos = createMemoryRepositories();
		cycles = createCycleService(repos, clock);
		const templates = createTemplateService(repos.templates, clock);
		templates.add({ name: 'Rent', amount: '18500.50', cadence: 'ANY' });
		templates.add({ name: 'Electric', amount: '', cadence: 'MONTH_END' });
		templates.add({ name: 'Internet', amount: '0.29', cadence: 'MID_MONTH' });
	});

	it('starts with no active cycle', () => {
		expect(cycles.getActive()).toBeNull();
	});

	it('copies matching saved items with locale-stable amounts', () => {
		cycles.start({ title: '', cadence: 'MID_MONTH', salary: '75,000' });
		const active = cycles.getActive();
		expect(active?.cycle.title).toBe('Payday 2026-10-15');
		expect(active?.cycle.date).toBe('2026-10-15');
		expect(active?.cycle.salary).toBe(7_500_000);
		expect(active?.items.map((item) => [item.name, item.amountExpr])).toEqual([
			['Internet', '0.29'],
			['Rent', '18500.50']
		]);
	});

	it('marks variable saved items as missing amounts', () => {
		start();
		const active = cycles.getActive();
		expect(active?.items).toHaveLength(3);
		expect(active?.summary.missingCount).toBe(1);
		expect(active?.summary.total).toBe(1_850_079);
	});

	it('allows one open cycle at a time', () => {
		start();
		expect(() => start('Second')).toThrow('Finish the current cycle first');
	});

	it('updates salary and computes leftover', () => {
		const id = start();
		cycles.setSalary(id, '80,000.25');
		expect(cycles.getActive()?.summary.leftover).toBe(8_000_025 - 1_850_079);
		expect(() => cycles.setSalary(id, '50.000,00')).toThrow(DomainError);
		expect(cycles.getActive()?.cycle.salary).toBe(8_000_025);
		cycles.setSalary(id, '');
		expect(cycles.getActive()?.cycle.salary).toBeNull();
	});

	it('saves and clears the note', () => {
		const id = start();
		cycles.setNote(id, 'Bonus payout');
		expect(cycles.getActive()?.cycle.note).toBe('Bonus payout');
		expect(() => cycles.setNote(id, 'x'.repeat(281))).toThrow(DomainError);
		cycles.setNote(id, '  ');
		expect(cycles.getActive()?.cycle.note).toBeNull();
	});

	it('finishes into read-only history and reopens only the latest', () => {
		const first = start();
		cycles.finish(first);
		expect(cycles.getActive()).toBeNull();
		expect(() => cycles.finish(first)).toThrow('This cycle is already finished');
		expect(() => cycles.setNote(first, 'late')).toThrow(DomainError);
		expect(cycles.history()).toMatchObject({
			reopenableId: first,
			cycles: [{ cycle: { id: first } }]
		});

		cycles.reopen(first);
		expect(cycles.getActive()?.cycle.id).toBe(first);
		expect(cycles.history().reopenableId).toBeNull();
		expect(() => cycles.reopen(first)).toThrow('Finish the current cycle first');

		cycles.finish(first);
		const second = start('Next');
		cycles.finish(second);
		expect(() => cycles.reopen(first)).toThrow('Only the most recent');
		expect(cycles.history().cycles.map((entry) => entry.cycle.id)).toEqual([second, first]);
	});

	it('clears all items of the open cycle only', () => {
		const id = start();
		cycles.clear(id);
		expect(cycles.getActive()?.items).toEqual([]);
		cycles.finish(id);
		expect(() => cycles.clear(id)).toThrow(DomainError);
		expect(() => cycles.clear(9999)).toThrow(DomainError);
	});
});
