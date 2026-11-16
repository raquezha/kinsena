import { describe, expect, it } from 'vitest';
import { allocationProgress, destinationChips, yearFromIsoDate } from './history-archive.ts';
import type { Destination, RouteItem } from './models.ts';
import type { PaydaySummary } from './summary.ts';

const dest = (
	id: number,
	name: string,
	color: string | null = '#ef4444'
): Destination & { brandIcon: { color: string } | null } => ({
	id,
	name,
	kind: 'BILLER',
	brandIcon: color ? { color } : null
});

const item = (partial: Partial<RouteItem> & Pick<RouteItem, 'id' | 'name'>): RouteItem => ({
	paydayId: 1,
	destinationId: null,
	fullAmount: 0,
	fullAmountExpr: '1',
	minimumAmount: null,
	chosenAmount: 0,
	decision: 'FULL',
	decisionReason: null,
	dueDate: null,
	isDone: true,
	sortOrder: 0,
	templateId: null,
	icon: null,
	...partial
});

const summary = (partial: Partial<PaydaySummary>): PaydaySummary => ({
	salary: null,
	plannedMin: 0,
	plannedFull: 0,
	routed: 0,
	leftToRoute: null,
	missingCount: 0,
	doneCount: 0,
	pendingCount: 0,
	skippedCount: 0,
	itemCount: 0,
	...partial
});

describe('history-archive', () => {
	it('builds top destination chips and a +N remainder', () => {
		const { chips, moreCount } = destinationChips(
			[
				item({ id: 1, name: 'Net', destinationId: 1, chosenAmount: 169_900 }),
				item({ id: 2, name: 'Rent', destinationId: 2, chosenAmount: 1_200_000 }),
				item({ id: 3, name: 'Power', destinationId: 3, chosenAmount: 850_000 }),
				item({ id: 4, name: 'Wifi', destinationId: 1, chosenAmount: 100_000 })
			],
			[dest(1, 'PLDT'), dest(2, 'BPI', '#b11116'), dest(3, 'Meralco', '#f97316')],
			2
		);
		expect(chips.map((chip) => chip.name)).toEqual(['BPI', 'Meralco']);
		expect(chips[0]?.amount).toBe(1_200_000);
		expect(moreCount).toBe(1);
	});

	it('skips open items, zero amounts, and unknown destinations', () => {
		const { chips, moreCount } = destinationChips(
			[
				item({ id: 1, name: 'Open', isDone: false, chosenAmount: 500 }),
				item({ id: 2, name: 'Zero', chosenAmount: 0, fullAmount: 0, fullAmountExpr: '' }),
				item({ id: 3, name: 'Full only', chosenAmount: 0, fullAmount: 250, destinationId: 9 }),
				item({ id: 4, name: 'Cash', chosenAmount: 100, destinationId: null }),
				item({ id: 5, name: 'Ghost dest', chosenAmount: 50, destinationId: 404 })
			],
			[dest(9, 'Known', null)],
			3
		);
		expect(chips).toEqual([
			{ name: 'Known', amount: 250, color: null },
			{ name: 'No destination', amount: 100, color: null },
			{ name: 'No destination', amount: 50, color: null }
		]);
		expect(moreCount).toBe(0);
	});

	it('computes allocation progress from planned full, salary, or done fallback', () => {
		expect(
			allocationProgress(summary({ plannedFull: 2_000_000, routed: 1_000_000, salary: 10_000_000 }))
		).toBe(0.5);
		expect(allocationProgress(summary({ plannedFull: 0, salary: 1_000, routed: 250 }))).toBe(0.25);
		expect(allocationProgress(summary({ plannedFull: 0, salary: null, doneCount: 2 }))).toBe(1);
		expect(allocationProgress(summary({ plannedFull: 0, salary: 0, doneCount: 0 }))).toBe(0);
		expect(allocationProgress(summary({ plannedFull: 100, routed: 200 }))).toBe(1);
		expect(yearFromIsoDate('2026-10-30')).toBe('2026');
	});
});
