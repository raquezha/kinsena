import { formatPaydayTitle } from './calendar.ts';
import { isSkipped } from './decision.ts';
import { hasKnownAmount, isReceived, type Cents, type Payday, type RouteItem } from './models.ts';

export interface PaydaySummary {
	/** Received amount if salary is in, otherwise the expected amount. */
	salary: Cents | null;
	/** Sum of minimums (or full when no minimum) of known, non-skipped items. */
	plannedMin: Cents;
	/** Sum of full amounts of known, non-skipped items. */
	plannedFull: Cents;
	/** Chosen amounts of items already marked done. */
	routed: Cents;
	/** Salary minus chosen amounts of non-skipped items. */
	leftToRoute: Cents | null;
	missingCount: number;
	doneCount: number;
	pendingCount: number;
	skippedCount: number;
	itemCount: number;
}

function plannedMinOf(item: RouteItem): Cents {
	return item.minimumAmount ?? item.fullAmount;
}

export function summarize(
	payday: Pick<Payday, 'expectedAmount' | 'receivedAmount' | 'receivedAt'>,
	items: RouteItem[]
): PaydaySummary {
	const salary = isReceived(payday) ? payday.receivedAmount : payday.expectedAmount;
	const known = items.filter(hasKnownAmount);
	const counted = known.filter((item) => !isSkipped(item.decision));
	const plannedMin = counted.reduce((sum, item) => sum + plannedMinOf(item), 0);
	const plannedFull = counted.reduce((sum, item) => sum + item.fullAmount, 0);
	const chosen = counted.reduce((sum, item) => sum + item.chosenAmount, 0);
	const routed = items
		.filter((item) => item.isDone && !isSkipped(item.decision))
		.reduce((sum, item) => sum + item.chosenAmount, 0);
	const skippedCount = items.filter((item) => isSkipped(item.decision)).length;
	const doneCount = items.filter((item) => item.isDone).length;
	return {
		salary,
		plannedMin,
		plannedFull,
		routed,
		leftToRoute: salary === null ? null : salary - chosen,
		missingCount: items.filter((item) => !isSkipped(item.decision) && !hasKnownAmount(item)).length,
		doneCount,
		pendingCount: items.length - doneCount - skippedCount,
		skippedCount,
		itemCount: items.length
	};
}

/** Open items first by manual rank, then done, skipped last. Due date is not a sort key. */
export function sortForChecklist(items: RouteItem[]): RouteItem[] {
	return [...items].sort((a, b) => {
		const skip = Number(isSkipped(a.decision)) - Number(isSkipped(b.decision));
		if (skip !== 0) return skip;
		const done = Number(a.isDone) - Number(b.isDone);
		if (done !== 0) return done;
		return a.sortOrder - b.sortOrder || a.id - b.id;
	});
}

export interface PaydayView {
	payday: Payday;
	items: RouteItem[];
	summary: PaydaySummary;
	/** Arrival explanation when payDate differs from the scheduled day. */
	arrivalNote: string | null;
}

/** Next payday is after this item's due date, so skipping would miss the due date. */
export function skipPastDueWarning(
	dueDate: string | null,
	nextScheduledDate: string | null
): string | null {
	if (!dueDate || !nextScheduledDate) return null;
	if (dueDate < nextScheduledDate) {
		const due = formatPaydayTitle(dueDate);
		const next = formatPaydayTitle(nextScheduledDate);
		return `This is due ${due}, before the next payday on ${next}.`;
	}
	return null;
}
