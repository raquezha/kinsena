import { describe, expect, it } from 'vitest';
import type { CycleItem } from './models.ts';
import { sortForChecklist, summarize } from './summary.ts';

function item(overrides: Partial<CycleItem>): CycleItem {
	return {
		id: 1,
		cycleId: 1,
		name: 'Item',
		amount: 0,
		amountExpr: '',
		isDone: false,
		sortOrder: 0,
		...overrides
	};
}

describe('summarize', () => {
	const items = [
		item({ id: 1, amount: 10, amountExpr: '0.10' }),
		item({ id: 2, amount: 20, amountExpr: '0.20', isDone: true }),
		item({ id: 3, amountExpr: '' }),
		item({ id: 4, amountExpr: null, isDone: true })
	];

	it('sums in cents without floating point drift', () => {
		const summary = summarize({ salary: 7_500_000 }, items);
		expect(summary.total).toBe(30);
		expect(summary.paid).toBe(20);
		expect(summary.remaining).toBe(10);
	});

	it('keeps leftover as salary minus all obligations', () => {
		expect(summarize({ salary: 7_500_000 }, items).leftover).toBe(7_499_970);
		expect(summarize({ salary: null }, items).leftover).toBeNull();
	});

	it('counts blanks as missing, and zero as known', () => {
		const summary = summarize({ salary: null }, [...items, item({ id: 5, amountExpr: '0' })]);
		expect(summary.missingCount).toBe(2);
		expect(summary.doneCount).toBe(2);
		expect(summary.pendingCount).toBe(3);
		expect(summary.itemCount).toBe(5);
	});
});

describe('sortForChecklist', () => {
	it('puts unpaid first, then by sort order and id', () => {
		const sorted = sortForChecklist([
			item({ id: 1, isDone: true, sortOrder: 0 }),
			item({ id: 2, sortOrder: 2 }),
			item({ id: 3, sortOrder: 1 }),
			item({ id: 4, sortOrder: 1 })
		]);
		expect(sorted.map((entry) => entry.id)).toEqual([3, 4, 2, 1]);
	});
});
