import { hasKnownAmount, type Cents, type Cycle, type CycleItem } from './models.ts';

export interface CycleSummary {
	/** Sum of all known amounts. Blank amounts count as nothing. */
	total: Cents;
	paid: Cents;
	remaining: Cents;
	/** Salary minus every obligation. Stays put while items are ticked off. */
	leftover: Cents | null;
	missingCount: number;
	doneCount: number;
	pendingCount: number;
	itemCount: number;
}

function sum(items: CycleItem[]): Cents {
	return items.reduce((total, item) => total + item.amount, 0);
}

export function summarize(cycle: Pick<Cycle, 'salary'>, items: CycleItem[]): CycleSummary {
	const known = items.filter(hasKnownAmount);
	const total = sum(known);
	const paid = sum(known.filter((item) => item.isDone));
	const doneCount = items.filter((item) => item.isDone).length;
	return {
		total,
		paid,
		remaining: total - paid,
		leftover: cycle.salary === null ? null : cycle.salary - total,
		missingCount: items.length - known.length,
		doneCount,
		pendingCount: items.length - doneCount,
		itemCount: items.length
	};
}

/** Unpaid first, then by the order items were added. */
export function sortForChecklist(items: CycleItem[]): CycleItem[] {
	return [...items].sort(
		(a, b) => Number(a.isDone) - Number(b.isDone) || a.sortOrder - b.sortOrder || a.id - b.id
	);
}

/** A cycle with its items in checklist order and their totals. */
export interface CycleView {
	cycle: Cycle;
	items: CycleItem[];
	summary: CycleSummary;
}
