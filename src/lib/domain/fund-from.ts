import type { PaydayCadence } from './cadence.ts';
import { dueDateInMonth, fromIsoDate, fundPaydayDate } from './calendar.ts';

/**
 * Which payday a saved item is copied into.
 * EVERY is the old "any payday" rule: both the 15th and month-end.
 */
export const FUND_FROMS = ['BEFORE_DUE', 'MID_MONTH', 'MONTH_END', 'EVERY'] as const;

export type FundFrom = (typeof FUND_FROMS)[number];

export const FUND_FROM_LABELS: Record<FundFrom, string> = {
	BEFORE_DUE: 'Payday before due date',
	MID_MONTH: 'Mid-month',
	MONTH_END: 'Month end',
	EVERY: 'Every payday'
};

export function isFundFrom(value: string): value is FundFrom {
	return (FUND_FROMS as readonly string[]).includes(value);
}

export interface TemplateRule {
	fundFrom: FundFrom;
	dueDay: number | null;
}

export interface PaydaySlot {
	cadence: PaydayCadence;
	scheduledDate: string;
}

/**
 * Returns the due date to stamp on a new item when this rule belongs on
 * the payday, or null if it should not be copied in.
 */
export function dueDateForPayday(rule: TemplateRule, payday: PaydaySlot): string | null {
	if (payday.cadence === 'OTHER') return null;
	const { year, month } = fromIsoDate(payday.scheduledDate);
	if (rule.fundFrom === 'EVERY' || rule.fundFrom === payday.cadence) {
		return rule.dueDay === null ? null : dueDateInMonth(year, month, rule.dueDay);
	}
	if (rule.fundFrom !== 'BEFORE_DUE') return null;
	if (rule.dueDay === null) return null;
	for (const offset of [-1, 0, 1]) {
		const index = year * 12 + (month - 1) + offset;
		const candidateYear = Math.floor(index / 12);
		const candidateMonth = (index % 12) + 1;
		const due = dueDateInMonth(candidateYear, candidateMonth, rule.dueDay);
		if (fundPaydayDate(due) === payday.scheduledDate) return due;
	}
	return null;
}

export function templateFitsPayday(rule: TemplateRule, payday: PaydaySlot): boolean {
	if (payday.cadence === 'OTHER') return false;
	if (rule.fundFrom === 'EVERY' || rule.fundFrom === payday.cadence) return true;
	if (rule.fundFrom !== 'BEFORE_DUE') return false;
	return dueDateForPayday(rule, payday) !== null;
}
