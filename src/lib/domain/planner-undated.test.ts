import { describe, expect, it } from 'vitest';
import { proposePlan, type PlannerItem, type ProposePlanInput } from './planner.ts';

function item(partial: Partial<PlannerItem> & Pick<PlannerItem, 'id' | 'name'>): PlannerItem {
	return {
		destinationName: null,
		dueDate: null,
		fullAmount: 0,
		hasKnownFull: false,
		minimumAmount: null,
		lastPaidAmount: null,
		lastPaidOn: null,
		sortOrder: partial.id,
		...partial
	};
}

function plan(
	overrides: (Partial<ProposePlanInput> & Pick<ProposePlanInput, 'items'>) | ProposePlanInput
) {
	return proposePlan({
		salary: 3_850_000,
		nextPaydayDate: '2026-11-30',
		currency: 'PHP',
		...overrides
	});
}

function line(result: ReturnType<typeof plan>, name: string) {
	const found = result.lines.find((entry) => entry.name === name);
	if (!found) throw new Error(`missing ${name}`);
	return found;
}

describe('proposePlan undated items', () => {
	it('treats an item without a due date as this payday, and formats that reason', () => {
		const transfer = item({
			id: 8,
			name: 'Savings',
			fullAmount: 500_000,
			hasKnownFull: true
		});
		const result = plan({ items: [transfer], salary: 500_000 });
		expect(line(result, 'Savings').reason).toBe('Full: on this payday');
	});

	it('keeps higher manual rank over a sooner due date when salary is tight', () => {
		const alpha = item({
			id: 21,
			name: 'Alpha',
			fullAmount: 400_000,
			hasKnownFull: true,
			sortOrder: 1
		});
		const beta = item({
			id: 22,
			name: 'Beta',
			fullAmount: 400_000,
			hasKnownFull: true,
			sortOrder: 2
		});
		const dated = item({
			id: 23,
			name: 'Dated',
			dueDate: '2026-11-20',
			fullAmount: 400_000,
			hasKnownFull: true,
			sortOrder: 0
		});
		const result = plan({ items: [beta, dated, alpha], salary: 400_000 });
		expect(line(result, 'Dated').decision).toBe('FULL');
		expect(line(result, 'Alpha').decision).toBe('SKIPPED');
		expect(line(result, 'Beta').decision).toBe('SKIPPED');
		expect(result.lines.map((entry) => entry.name)).toEqual(['Dated', 'Alpha', 'Beta']);
	});

	it('returns an empty plan when there are no items', () => {
		const result = plan({ items: [], salary: 1_000_000 });
		expect(result).toEqual({ lines: [], total: 0, leftover: 1_000_000 });
	});
});
