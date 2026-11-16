import { describe, expect, it } from 'vitest';
import { allocationProgress, destinationChips, yearFromIsoDate } from './history-archive.ts';
import type { Destination, RouteItem } from './models.ts';
import type { PaydaySummary } from './summary.ts';

const dest = (
	id: number,
	name: string,
	color: string
): Destination & { brandIcon: { color: string } } => ({
	id,
	name,
	kind: 'BILLER',
	brandIcon: { color }
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

describe('history-archive', () => {
	it('builds top destination chips and a +N remainder', () => {
		const { chips, moreCount } = destinationChips(
			[
				item({ id: 1, name: 'Net', destinationId: 1, chosenAmount: 169_900 }),
				item({ id: 2, name: 'Rent', destinationId: 2, chosenAmount: 1_200_000 }),
				item({ id: 3, name: 'Power', destinationId: 3, chosenAmount: 850_000 }),
				item({ id: 4, name: 'Wifi', destinationId: 1, chosenAmount: 100_000 })
			],
			[dest(1, 'PLDT', '#ef4444'), dest(2, 'BPI', '#b11116'), dest(3, 'Meralco', '#f97316')],
			2
		);
		expect(chips.map((chip) => chip.name)).toEqual(['BPI', 'Meralco']);
		expect(chips[0]?.amount).toBe(1_200_000);
		expect(moreCount).toBe(1);
	});

	it('computes allocation progress from planned full', () => {
		const summary = {
			salary: 10_000_000,
			plannedMin: 0,
			plannedFull: 2_000_000,
			routed: 1_000_000,
			leftToRoute: 9_000_000,
			missingCount: 0,
			doneCount: 1,
			pendingCount: 1,
			skippedCount: 0,
			itemCount: 2
		} satisfies PaydaySummary;
		expect(allocationProgress(summary)).toBe(0.5);
		expect(yearFromIsoDate('2026-10-30')).toBe('2026');
	});
});
