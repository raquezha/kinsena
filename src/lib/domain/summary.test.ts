import { describe, expect, it } from 'vitest';
import type { RouteItem } from './models.ts';
import { skipPastDueWarning, sortForChecklist, summarize } from './summary.ts';

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

const payday = { expectedAmount: 7_500_000, receivedAmount: null, receivedAt: null };

describe('summarize', () => {
	const items = [
		item({
			id: 1,
			fullAmount: 1_000_000,
			fullAmountExpr: '10000',
			minimumAmount: 200_000,
			chosenAmount: 1_000_000,
			decision: 'FULL',
			isDone: true
		}),
		item({
			id: 2,
			fullAmount: 500_000,
			fullAmountExpr: '5000',
			minimumAmount: 100_000,
			chosenAmount: 0,
			decision: 'PENDING'
		}),
		item({ id: 3, fullAmountExpr: '' }),
		item({
			id: 4,
			fullAmount: 300_000,
			fullAmountExpr: '3000',
			chosenAmount: 0,
			decision: 'SKIPPED'
		})
	];

	it('uses expected salary until it is received', () => {
		const summary = summarize(payday, items);
		expect(summary.salary).toBe(7_500_000);
		expect(summary.plannedMin).toBe(300_000);
		expect(summary.plannedFull).toBe(1_500_000);
		expect(summary.routed).toBe(1_000_000);
		expect(summary.leftToRoute).toBe(6_500_000);
		expect(summary.missingCount).toBe(1);
		expect(summary.skippedCount).toBe(1);
		expect(summary.doneCount).toBe(1);
		expect(summary.pendingCount).toBe(2);
		expect(summary.itemCount).toBe(4);
	});

	it('switches to the received amount once salary is in', () => {
		const received = summarize(
			{ expectedAmount: 7_500_000, receivedAmount: 8_000_000, receivedAt: '2026-11-15' },
			items
		);
		expect(received.salary).toBe(8_000_000);
		expect(received.leftToRoute).toBe(7_000_000);
		expect(
			summarize({ expectedAmount: null, receivedAmount: null, receivedAt: null }, items).leftToRoute
		).toBeNull();
	});

	it('treats an explicit zero as a known amount', () => {
		const summary = summarize(payday, [item({ id: 5, fullAmountExpr: '0', fullAmount: 0 })]);
		expect(summary.missingCount).toBe(0);
		expect(summary.plannedFull).toBe(0);
	});
});

describe('sortForChecklist', () => {
	it('puts open items first by sort order, then done, skipped last', () => {
		const sorted = sortForChecklist([
			item({ id: 1, isDone: true, dueDate: '2026-11-01', sortOrder: 0 }),
			item({ id: 2, dueDate: '2026-11-20', sortOrder: 2 }),
			item({ id: 3, dueDate: '2026-11-10', sortOrder: 1 }),
			item({ id: 4, dueDate: null, sortOrder: 0 }),
			item({ id: 5, decision: 'SKIPPED', dueDate: '2026-11-05', sortOrder: 0 })
		]);
		expect(sorted.map((entry) => entry.id)).toEqual([4, 3, 2, 1, 5]);
	});

	it('ignores due date among open items', () => {
		const sorted = sortForChecklist([
			item({ id: 1, dueDate: '2026-11-01', sortOrder: 2 }),
			item({ id: 2, dueDate: '2026-12-01', sortOrder: 1 })
		]);
		expect(sorted.map((entry) => entry.id)).toEqual([2, 1]);
	});

	it('breaks ties by sort order, then by id', () => {
		const sorted = sortForChecklist([
			item({ id: 8, dueDate: '2026-11-10', sortOrder: 2 }),
			item({ id: 7, dueDate: '2026-11-10', sortOrder: 2 }),
			item({ id: 9, dueDate: '2026-11-10', sortOrder: 1 })
		]);
		expect(sorted.map((entry) => entry.id)).toEqual([9, 7, 8]);
	});
});

describe('skipPastDueWarning', () => {
	it('warns when the due date is before the next payday', () => {
		expect(skipPastDueWarning('2026-11-20', '2026-11-30')).toMatch(/before the next payday/);
		expect(skipPastDueWarning('2026-12-05', '2026-11-30')).toBeNull();
		expect(skipPastDueWarning(null, '2026-11-30')).toBeNull();
		expect(skipPastDueWarning('2026-11-20', null)).toBeNull();
	});
});
