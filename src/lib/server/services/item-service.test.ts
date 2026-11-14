import { beforeEach, describe, expect, it } from 'vitest';
import { DomainError } from '../../domain/errors.ts';
import { createTestClock } from '../testing/clock.ts';
import { createMemoryRepositories } from '../testing/memory-repositories.ts';
import { createCycleService, type CycleService } from './cycle-service.ts';
import { createItemService, type ItemService } from './item-service.ts';

describe('item service', () => {
	let cycles: CycleService;
	let items: ItemService;
	let cycleId: number;

	const active = () => cycles.getActive();
	const find = (name: string) => active()?.items.find((item) => item.name === name);

	beforeEach(() => {
		const repos = createMemoryRepositories();
		cycles = createCycleService(repos, createTestClock());
		items = createItemService(repos);
		cycleId = cycles.start({ title: 'Payday', cadence: 'ANY', salary: '' });
	});

	it('adds items at the end with parsed amounts', () => {
		items.add(cycleId, ' One-off ', '25');
		items.add(cycleId, 'Groceries', '10,538.91 + 3403');
		expect(find('One-off')).toMatchObject({ amount: 2500, amountExpr: '25', sortOrder: 0 });
		expect(find('Groceries')).toMatchObject({ amount: 1_394_191, sortOrder: 1 });
		expect(() => items.add(cycleId, 'x'.repeat(129), '1')).toThrow(DomainError);
		expect(() => items.add(cycleId, 'Typo', '1000 + typo')).toThrow(DomainError);
		expect(active()?.items).toHaveLength(2);
	});

	it('toggles paid and back, which is how undo works', () => {
		const id = items.add(cycleId, 'Rent', '18500.50');
		expect(items.toggle(id)).toBe(true);
		expect(active()?.summary.paid).toBe(1_850_050);
		expect(items.toggle(id)).toBe(false);
		expect(active()?.summary.paid).toBe(0);
	});

	it('distinguishes blank from an explicit zero', () => {
		const id = items.add(cycleId, 'Item', '');
		expect(active()?.summary.missingCount).toBe(1);
		items.setAmount(id, '0');
		expect(active()?.summary.missingCount).toBe(0);
		items.setAmount(id, '0.10 + 0.20');
		expect(find('Item')?.amount).toBe(30);
		expect(() => items.setAmount(id, '2 + nope')).toThrow(DomainError);
		expect(find('Item')?.amount).toBe(30);
		items.setAmount(id, '');
		expect(active()?.summary.missingCount).toBe(1);
	});

	it('removes and restores an item in place', () => {
		items.add(cycleId, 'First', '1');
		const id = items.add(cycleId, 'Second', '2');
		items.toggle(id);
		const removed = items.remove(id);
		expect(find('Second')).toBeUndefined();
		items.restore(removed);
		expect(find('Second')).toMatchObject({ amount: 200, isDone: true, sortOrder: 1 });
	});

	it('restores items whose amount was blank', () => {
		const id = items.add(cycleId, 'Blank', '');
		items.restore({ ...items.remove(id), amountExpr: null });
		expect(find('Blank')).toMatchObject({ amountExpr: '', amount: 0 });
	});

	it('rejects changes once the cycle is finished', () => {
		const id = items.add(cycleId, 'Rent', '100');
		cycles.finish(cycleId);
		expect(() => items.toggle(id)).toThrow('Item is not in the active cycle');
		expect(() => items.setAmount(id, '99')).toThrow(DomainError);
		expect(() => items.remove(id)).toThrow(DomainError);
		expect(() => items.add(cycleId, 'Late', '1')).toThrow(DomainError);
		expect(() => items.toggle(9999)).toThrow(DomainError);
	});
});
