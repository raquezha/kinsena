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

describe('proposePlan', () => {
	const rent = item({
		id: 1,
		name: 'Rent',
		destinationName: 'Landlord',
		dueDate: '2026-11-20',
		fullAmount: 1_200_000,
		hasKnownFull: true,
		minimumAmount: 1_200_000
	});
	const card = item({
		id: 2,
		name: 'Card',
		dueDate: '2026-11-20',
		fullAmount: 840_000,
		hasKnownFull: true,
		minimumAmount: 200_000
	});
	const electric = item({
		id: 3,
		name: 'Electricity',
		destinationName: 'Meralco',
		dueDate: '2026-11-25',
		fullAmount: 0,
		hasKnownFull: false,
		minimumAmount: 100_000,
		lastPaidAmount: 350_000,
		lastPaidOn: '2026-10-31'
	});
	const later = item({
		id: 4,
		name: 'Streaming',
		dueDate: '2026-12-02',
		fullAmount: 500_000,
		hasKnownFull: true,
		minimumAmount: 500_000
	});

	it('pays everything in full when salary covers it', () => {
		const result = plan({ items: [rent, card], salary: 3_000_000 });
		expect(line(result, 'Rent')).toMatchObject({
			decision: 'FULL',
			amount: 1_200_000,
			destinationName: 'Landlord',
			reason: 'Full: due Nov 20, before your next payday Nov 30'
		});
		expect(line(result, 'Card').decision).toBe('FULL');
		expect(result.total).toBe(2_040_000);
		expect(result.leftover).toBe(960_000);
	});

	it('skips items due after the next payday even when salary would cover them', () => {
		const result = plan({ items: [rent, later], salary: 3_000_000 });
		expect(line(result, 'Rent').decision).toBe('FULL');
		expect(line(result, 'Streaming')).toMatchObject({
			decision: 'SKIPPED',
			amount: 0,
			reason: 'Skip: due Dec 2, after your next payday Nov 30'
		});
		expect(result.total).toBe(1_200_000);
		expect(result.leftover).toBe(1_800_000);
	});

	it('prefills a variable amount from the last paid payday', () => {
		const result = plan({ items: [electric], salary: 500_000 });
		expect(line(result, 'Electricity')).toMatchObject({
			decision: 'FULL',
			amount: 350_000,
			usedLastPaid: true,
			reason: 'Full: last paid ₱3,500.00 on Oct 31'
		});
	});

	it('degrades to minimums when full would exceed salary', () => {
		const result = plan({ items: [rent, card, later], salary: 1_600_000 });
		expect(line(result, 'Rent').decision).toBe('FULL');
		expect(line(result, 'Card')).toMatchObject({
			decision: 'MINIMUM',
			amount: 200_000,
			reason: 'Minimum: full would exceed salary'
		});
		expect(line(result, 'Streaming')).toMatchObject({
			decision: 'SKIPPED',
			amount: 0,
			reason: 'Skip: due Dec 2, after your next payday Nov 30'
		});
		expect(result.total).toBe(1_400_000);
	});

	it('skips latest-due-after-next payday first when a later full no longer fits', () => {
		const result = plan({
			items: [rent, card, later],
			salary: 1_450_000
		});
		expect(line(result, 'Streaming').decision).toBe('SKIPPED');
		expect(line(result, 'Rent').decision).toBe('FULL');
		expect(line(result, 'Card').decision).toBe('MINIMUM');
		expect(result.total).toBe(1_400_000);
	});

	it('skips remaining latest dues when salary is below the sum of minimums', () => {
		const result = plan({ items: [rent, card, later], salary: 200_000 });
		expect(line(result, 'Streaming').decision).toBe('SKIPPED');
		expect(line(result, 'Rent').decision).toBe('SKIPPED');
		expect(line(result, 'Card')).toMatchObject({
			decision: 'MINIMUM',
			amount: 200_000
		});
		expect(line(result, 'Rent').reason).toBe('Skip: leftover salary is not enough');
		expect(result.total).toBe(200_000);
		expect(result.leftover).toBe(0);
	});

	it('skips every item when salary is not entered', () => {
		const result = plan({ items: [rent, card], salary: null });
		expect(result.lines.every((entry) => entry.decision === 'SKIPPED')).toBe(true);
		expect(line(result, 'Rent').reason).toBe('Skip: salary not entered');
		expect(result.total).toBe(0);
		expect(result.leftover).toBeNull();
	});

	it('skips items that have no amount at all', () => {
		const unknown = item({ id: 9, name: 'Unknown bill', dueDate: '2026-11-18' });
		const result = plan({ items: [unknown], salary: 1_000_000 });
		expect(line(result, 'Unknown bill')).toMatchObject({
			decision: 'SKIPPED',
			reason: 'Skip: amount not set'
		});
	});

	it('uses the minimum when that is the only known amount', () => {
		const minOnly = item({
			id: 5,
			name: 'Phone',
			dueDate: '2026-11-18',
			minimumAmount: 99_900
		});
		const result = plan({ items: [minOnly], salary: 200_000 });
		expect(line(result, 'Phone')).toMatchObject({
			decision: 'MINIMUM',
			amount: 99_900,
			reason: 'Minimum: no full amount set'
		});
	});

	it('does not skip for timing when there is no next payday, and skips latest due if short', () => {
		const early = item({
			id: 1,
			name: 'Early',
			dueDate: '2026-11-16',
			fullAmount: 800_000,
			hasKnownFull: true,
			minimumAmount: 800_000
		});
		const late = item({
			id: 2,
			name: 'Late',
			dueDate: '2026-12-20',
			fullAmount: 800_000,
			hasKnownFull: true,
			minimumAmount: 800_000
		});
		const result = plan({
			items: [early, late],
			salary: 800_000,
			nextPaydayDate: null
		});
		expect(line(result, 'Early').decision).toBe('FULL');
		expect(line(result, 'Late')).toMatchObject({
			decision: 'SKIPPED',
			reason: 'Skip: leftover salary is not enough'
		});
		expect(line(result, 'Early').reason).toBe('Full: due Nov 16');
	});

	it('breaks ties by sort order, then by id, skipping the later item first', () => {
		const first = item({
			id: 10,
			name: 'First',
			dueDate: '2026-11-20',
			fullAmount: 300_000,
			hasKnownFull: true,
			minimumAmount: 300_000,
			sortOrder: 1
		});
		const second = item({
			id: 11,
			name: 'Second',
			dueDate: '2026-11-20',
			fullAmount: 300_000,
			hasKnownFull: true,
			minimumAmount: 300_000,
			sortOrder: 2
		});
		const sameOrder = item({
			id: 12,
			name: 'Third',
			dueDate: '2026-11-20',
			fullAmount: 300_000,
			hasKnownFull: true,
			minimumAmount: 300_000,
			sortOrder: 2
		});
		const result = plan({ items: [first, second, sameOrder], salary: 300_000 });
		expect(line(result, 'First').decision).toBe('FULL');
		expect(line(result, 'Third').decision).toBe('SKIPPED');
		expect(line(result, 'Second').decision).toBe('SKIPPED');
	});

	it('keeps higher manual rank when an earlier due date would have won before', () => {
		const laterRanked = item({
			id: 1,
			name: 'Later due, higher rank',
			dueDate: '2026-11-28',
			fullAmount: 500_000,
			hasKnownFull: true,
			minimumAmount: 500_000,
			sortOrder: 0
		});
		const soonerRanked = item({
			id: 2,
			name: 'Sooner due, lower rank',
			dueDate: '2026-11-16',
			fullAmount: 500_000,
			hasKnownFull: true,
			minimumAmount: 500_000,
			sortOrder: 1
		});
		const result = plan({ items: [soonerRanked, laterRanked], salary: 500_000 });
		expect(line(result, 'Later due, higher rank').decision).toBe('FULL');
		expect(line(result, 'Sooner due, lower rank').decision).toBe('SKIPPED');
	});
});
