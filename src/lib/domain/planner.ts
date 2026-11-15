/** Pure payday plan: split salary across items with reasons, no I/O. */
import type { CurrencyCode } from './currency.ts';
import { compareIsoDate, formatPaydayShort } from './calendar.ts';
import { formatMoney } from './money.ts';

export interface PlannerItem {
	id: number;
	name: string;
	destinationName: string | null;
	dueDate: string | null;
	fullAmount: number;
	hasKnownFull: boolean;
	minimumAmount: number | null;
	lastPaidAmount: number | null;
	lastPaidOn: string | null;
	sortOrder: number;
}

export type ProposedDecision = 'FULL' | 'MINIMUM' | 'SKIPPED';

export interface ProposalLine {
	itemId: number;
	name: string;
	destinationName: string | null;
	dueDate: string | null;
	amount: number;
	fullAmount: number | null;
	minimumAmount: number | null;
	decision: ProposedDecision;
	reason: string;
	usedLastPaid: boolean;
}

export interface PlanProposal {
	lines: ProposalLine[];
	total: number;
	leftover: number | null;
}

export interface ProposePlanInput {
	salary: number | null;
	items: readonly PlannerItem[];
	nextPaydayDate: string | null;
	currency: CurrencyCode;
}

interface Draft {
	item: PlannerItem;
	decision: ProposedDecision;
	amount: number;
	usedLastPaid: boolean;
	effectiveFull: number | null;
}

/** Draft a split that never totals more than salary. */
export function proposePlan(input: ProposePlanInput): PlanProposal {
	const drafts = input.items.map((item) => initialDraft(item, input.salary, input.nextPaydayDate));
	if (input.salary !== null) tightenToSalary(drafts, input.salary, input.nextPaydayDate);
	const lines = drafts.map((draft) => toLine(draft, input));
	const total = sumAllocated(drafts);
	return {
		lines,
		total,
		leftover: input.salary === null ? null : input.salary - total
	};
}

export function effectiveFullAmount(item: PlannerItem): {
	amount: number | null;
	usedLastPaid: boolean;
} {
	if (item.hasKnownFull) return { amount: item.fullAmount, usedLastPaid: false };
	if (item.lastPaidAmount !== null) return { amount: item.lastPaidAmount, usedLastPaid: true };
	return { amount: null, usedLastPaid: false };
}

function initialDraft(
	item: PlannerItem,
	salary: number | null,
	nextPaydayDate: string | null
): Draft {
	const full = effectiveFullAmount(item);
	if (salary === null) {
		return {
			item,
			decision: 'SKIPPED',
			amount: 0,
			usedLastPaid: false,
			effectiveFull: full.amount
		};
	}
	if (dueAfterNext(item.dueDate, nextPaydayDate)) {
		return {
			item,
			decision: 'SKIPPED',
			amount: 0,
			usedLastPaid: false,
			effectiveFull: full.amount
		};
	}
	if (full.amount !== null) {
		return {
			item,
			decision: 'FULL',
			amount: full.amount,
			usedLastPaid: full.usedLastPaid,
			effectiveFull: full.amount
		};
	}
	if (item.minimumAmount !== null) {
		return {
			item,
			decision: 'MINIMUM',
			amount: item.minimumAmount,
			usedLastPaid: false,
			effectiveFull: null
		};
	}
	return { item, decision: 'SKIPPED', amount: 0, usedLastPaid: false, effectiveFull: null };
}

function tightenToSalary(drafts: Draft[], salary: number, nextPaydayDate: string | null): void {
	const keepFirst = keepPriority(nextPaydayDate);
	let remaining = salary;
	for (const draft of [...drafts].sort(keepFirst)) {
		if (draft.decision === 'SKIPPED') continue;
		if (remaining >= draft.amount) {
			remaining -= draft.amount;
			continue;
		}
		const minimum = draft.item.minimumAmount;
		if (canDowngrade(draft) && minimum !== null && remaining >= minimum) {
			draft.decision = 'MINIMUM';
			draft.amount = minimum;
			remaining -= minimum;
			continue;
		}
		draft.decision = 'SKIPPED';
		draft.amount = 0;
		draft.usedLastPaid = false;
	}
}

function keepPriority(nextPaydayDate: string | null) {
	const skipFirst = skipPriority(nextPaydayDate);
	return (left: Draft, right: Draft) => skipFirst(right, left);
}

function canDowngrade(draft: Draft): boolean {
	return (
		draft.decision === 'FULL' &&
		draft.item.minimumAmount !== null &&
		draft.item.minimumAmount < draft.amount
	);
}

function skipPriority(nextPaydayDate: string | null) {
	return (left: Draft, right: Draft): number => {
		const rank = urgencyRank(right.item, nextPaydayDate) - urgencyRank(left.item, nextPaydayDate);
		if (rank !== 0) return rank;
		const due = compareDue(right.item.dueDate, left.item.dueDate);
		if (due !== 0) return due;
		return right.item.sortOrder - left.item.sortOrder || right.item.id - left.item.id;
	};
}

/** Higher means skip or degrade first: after the next payday, then later dates. */
function urgencyRank(item: PlannerItem, nextPaydayDate: string | null): number {
	return dueAfterNext(item.dueDate, nextPaydayDate) ? 1 : 0;
}

export function dueAfterNext(dueDate: string | null, nextPaydayDate: string | null): boolean {
	return dueDate !== null && nextPaydayDate !== null && compareIsoDate(dueDate, nextPaydayDate) > 0;
}

function compareDue(left: string | null, right: string | null): number {
	if (left === null && right === null) return 0;
	if (left === null) return -1;
	if (right === null) return 1;
	return compareIsoDate(left, right);
}

function sumAllocated(drafts: Draft[]): number {
	return drafts.reduce((sum, draft) => sum + draft.amount, 0);
}

function toLine(draft: Draft, input: ProposePlanInput): ProposalLine {
	return {
		itemId: draft.item.id,
		name: draft.item.name,
		destinationName: draft.item.destinationName,
		dueDate: draft.item.dueDate,
		amount: draft.amount,
		fullAmount: draft.effectiveFull,
		minimumAmount: draft.item.minimumAmount,
		decision: draft.decision,
		reason: reasonFor(draft, input),
		usedLastPaid: draft.usedLastPaid
	};
}

function reasonFor(draft: Draft, input: ProposePlanInput): string {
	if (draft.decision === 'FULL') return reasonForFull(draft, input);
	if (draft.decision === 'MINIMUM') {
		return draft.effectiveFull !== null
			? 'Minimum: full would exceed salary'
			: 'Minimum: no full amount set';
	}
	return reasonForSkip(draft, input);
}

function reasonForFull(draft: Draft, input: ProposePlanInput): string {
	const { item } = draft;
	if (draft.usedLastPaid && item.lastPaidOn) {
		const amount = formatMoney(draft.amount, input.currency);
		return `Full: last paid ${amount} on ${formatPaydayShort(item.lastPaidOn)}`;
	}
	const next = input.nextPaydayDate;
	if (item.dueDate && next && !dueAfterNext(item.dueDate, next)) {
		const due = formatPaydayShort(item.dueDate);
		return `Full: due ${due}, before your next payday ${formatPaydayShort(next)}`;
	}
	if (item.dueDate) return `Full: due ${formatPaydayShort(item.dueDate)}`;
	return 'Full: on this payday';
}

function reasonForSkip(draft: Draft, input: ProposePlanInput): string {
	const { item } = draft;
	const next = input.nextPaydayDate;
	if (input.salary === null) return 'Skip: salary not entered';
	if (draft.effectiveFull === null && item.minimumAmount === null) {
		return 'Skip: amount not set';
	}
	if (item.dueDate && next && dueAfterNext(item.dueDate, next)) {
		const due = formatPaydayShort(item.dueDate);
		return `Skip: due ${due}, after your next payday ${formatPaydayShort(next)}`;
	}
	return 'Skip: leftover salary is not enough';
}
