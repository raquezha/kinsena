import { describe, expect, it } from 'vitest';
import { DomainError } from './errors.ts';
import type { RouteItem } from './models.ts';
import {
	checklistOpenOrderAfter,
	isChecklistOpen,
	openItemIds,
	sortOrdersForOpenReorder,
	withOpenReorder
} from './reorder.ts';
import { sortForChecklist } from './summary.ts';

function item(overrides: Partial<RouteItem>): RouteItem {
	return {
		id: 1,
		paydayId: 1,
		destinationId: null,
		name: 'Item',
		fullAmount: 0,
		fullAmountExpr: '',
		minimumAmount: null,
		chosenAmount: 0,
		decision: 'PENDING',
		decisionReason: null,
		dueDate: null,
		isDone: false,
		sortOrder: 0,
		templateId: null,
		...overrides
	};
}

describe('isChecklistOpen / openItemIds', () => {
	it('treats pending and decided unpaid items as open', () => {
		expect(isChecklistOpen(item({ decision: 'PENDING' }))).toBe(true);
		expect(isChecklistOpen(item({ decision: 'FULL' }))).toBe(true);
		expect(isChecklistOpen(item({ decision: 'MINIMUM' }))).toBe(true);
		expect(isChecklistOpen(item({ decision: 'CUSTOM' }))).toBe(true);
	});

	it('excludes done and skipped from open', () => {
		expect(isChecklistOpen(item({ isDone: true, decision: 'FULL' }))).toBe(false);
		expect(isChecklistOpen(item({ decision: 'SKIPPED' }))).toBe(false);
		expect(isChecklistOpen(item({ isDone: true, decision: 'SKIPPED' }))).toBe(false);
	});

	it('lists only open ids in current list order', () => {
		const items = [
			item({ id: 1, sortOrder: 0 }),
			item({ id: 2, isDone: true, decision: 'FULL', sortOrder: 1 }),
			item({ id: 3, decision: 'SKIPPED', sortOrder: 2 }),
			item({ id: 4, sortOrder: 3 })
		];
		expect(openItemIds(items)).toEqual([1, 4]);
	});
});

describe('sortOrdersForOpenReorder', () => {
	it('writes contiguous ranks for a full permutation', () => {
		const orders = sortOrdersForOpenReorder([1, 2, 3], [3, 1, 2]);
		expect([...orders.entries()]).toEqual([
			[3, 0],
			[1, 1],
			[2, 2]
		]);
	});

	it('rejects empty when opens exist', () => {
		expect(() => sortOrdersForOpenReorder([1], [])).toThrow(DomainError);
		expect(() => sortOrdersForOpenReorder([1], [])).toThrow(/out of date/i);
	});

	it('allows empty reorder when there are no open items', () => {
		expect([...sortOrdersForOpenReorder([], []).entries()]).toEqual([]);
	});

	it('rejects duplicate ids', () => {
		expect(() => sortOrdersForOpenReorder([1, 2], [1, 1])).toThrow(/out of date/i);
	});

	it('rejects partial lists (stale client)', () => {
		expect(() => sortOrdersForOpenReorder([1, 2, 3], [2, 1])).toThrow(/out of date/i);
	});

	it('rejects extra ids not on the payday open set', () => {
		expect(() => sortOrdersForOpenReorder([1, 2], [1, 2, 99])).toThrow(/out of date/i);
	});

	it('rejects a foreign id that replaces a real open id', () => {
		expect(() => sortOrdersForOpenReorder([1, 2], [1, 99])).toThrow(/open items/i);
	});
});

describe('parity: UI open order ↔ sortForChecklist after reorder', () => {
	const base = [
		item({ id: 10, name: 'A', dueDate: '2026-12-01', sortOrder: 0 }),
		item({ id: 20, name: 'B', dueDate: '2026-11-01', sortOrder: 1 }),
		item({ id: 30, name: 'C', dueDate: '2026-10-01', sortOrder: 2 }),
		item({ id: 40, name: 'Done', isDone: true, decision: 'FULL', sortOrder: 9 }),
		item({ id: 50, name: 'Skip', decision: 'SKIPPED', sortOrder: 8 })
	];

	it('moves first to last without disturbing done/skipped buckets', () => {
		expect(checklistOpenOrderAfter(base, [20, 30, 10])).toEqual([20, 30, 10]);
		const sorted = sortForChecklist(withOpenReorder(base, [20, 30, 10]));
		expect(sorted.map((entry) => entry.id)).toEqual([20, 30, 10, 40, 50]);
	});

	it('moves last to first', () => {
		expect(checklistOpenOrderAfter(base, [30, 10, 20])).toEqual([30, 10, 20]);
	});

	it('ignores due dates among open items after reorder (manual rank wins)', () => {
		const sorted = sortForChecklist(withOpenReorder(base, [30, 20, 10]));
		expect(openItemIds(sorted)).toEqual([30, 20, 10]);
		expect(sorted[0]?.dueDate).toBe('2026-10-01');
	});

	it('no-op reorder keeps identity order', () => {
		expect(checklistOpenOrderAfter(base, [10, 20, 30])).toEqual([10, 20, 30]);
	});

	it('single open item only accepts its own id', () => {
		const one = [item({ id: 7, sortOrder: 5 }), item({ id: 8, isDone: true, decision: 'FULL' })];
		expect(checklistOpenOrderAfter(one, [7])).toEqual([7]);
		expect(() => checklistOpenOrderAfter(one, [8])).toThrow();
	});

	it('swap of two neighbors is symmetric', () => {
		expect(checklistOpenOrderAfter(base, [20, 10, 30])).toEqual([20, 10, 30]);
		expect(checklistOpenOrderAfter(base, [10, 30, 20])).toEqual([10, 30, 20]);
	});

	it('round-trips a reverse permutation back to the start', () => {
		const reversed = checklistOpenOrderAfter(base, [30, 20, 10]);
		expect(reversed).toEqual([30, 20, 10]);
		expect(checklistOpenOrderAfter(withOpenReorder(base, reversed), [10, 20, 30])).toEqual([
			10, 20, 30
		]);
	});

	it('keeps contiguous ranks for a longer open list', () => {
		const many = [
			item({ id: 1, sortOrder: 0 }),
			item({ id: 2, sortOrder: 1 }),
			item({ id: 3, sortOrder: 2 }),
			item({ id: 4, sortOrder: 3 }),
			item({ id: 5, sortOrder: 4 }),
			item({ id: 9, isDone: true, decision: 'FULL', sortOrder: 99 })
		];
		const order = [5, 1, 4, 2, 3];
		expect(checklistOpenOrderAfter(many, order)).toEqual(order);
		const ranks = sortOrdersForOpenReorder(openItemIds(many), order);
		expect([...ranks.values()]).toEqual([0, 1, 2, 3, 4]);
	});
});
