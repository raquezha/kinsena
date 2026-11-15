/** Pure payday calendar: scheduled dates, working-day shifts, year schedule. */
import {
	addMonths,
	fromIsoDate,
	lastDayOfMonth,
	toIsoDate,
	type PaydayCadence
} from './calendar.ts';
import { formatPaydayShort } from './calendar.ts';
import {
	DEFAULT_PAY_RULE,
	WEEKDAY_SHORT,
	type HolidayKind,
	type HolidayRef,
	type PayRule,
	type WeekdayIndex
} from './pay-rule.ts';

export interface ScheduleEntry {
	year: number;
	month: number;
	cadence: PaydayCadence;
	scheduledDate: string;
	computedPayDate: string;
	payDate: string;
	reason: string | null;
	overridden: boolean;
	locked: boolean;
}

export interface YearScheduleInput {
	year: number;
	rule?: PayRule;
	holidays?: readonly HolidayRef[];
	/** Manual pay dates keyed by scheduled date. */
	overrides?: Readonly<Record<string, string>>;
	/** Received or closed paydays, keyed by scheduled date. These never move. */
	locked?: Readonly<Record<string, string>>;
}

export function weekday(iso: string): WeekdayIndex {
	const { year, month, day } = fromIsoDate(iso);
	return new Date(year, month - 1, day).getDay() as WeekdayIndex;
}

export function addDays(iso: string, delta: number): string {
	const { year, month, day } = fromIsoDate(iso);
	const next = new Date(year, month - 1, day + delta);
	return toIsoDate({
		year: next.getFullYear(),
		month: next.getMonth() + 1,
		day: next.getDate()
	});
}

/** Clamp a day-of-month onto a real calendar date using the short-month policy. */
export function scheduledDate(year: number, month: number, dayOfMonth: number): string {
	const last = lastDayOfMonth(year, month);
	return toIsoDate({ year, month, day: Math.min(dayOfMonth, last) });
}

export function scheduledSlots(
	year: number,
	month: number,
	rule: PayRule = DEFAULT_PAY_RULE
): { cadence: 'MID_MONTH' | 'MONTH_END'; scheduledDate: string }[] {
	const [early, late] = rule.daysOfMonth;
	const mid = scheduledDate(year, month, early);
	const end = scheduledDate(year, month, late);
	if (mid === end) return [{ cadence: 'MONTH_END', scheduledDate: end }];
	return [
		{ cadence: 'MID_MONTH', scheduledDate: mid },
		{ cadence: 'MONTH_END', scheduledDate: end }
	];
}

export function countsAsHoliday(kind: HolidayKind, rule: PayRule): boolean {
	if (kind === 'NATIONAL') return rule.includeNationalHolidays;
	return rule.includeLocalHolidays;
}

export function holidaysOn(
	iso: string,
	holidays: readonly HolidayRef[],
	rule: PayRule = DEFAULT_PAY_RULE
): HolidayRef[] {
	return holidays.filter((holiday) => holiday.date === iso && countsAsHoliday(holiday.kind, rule));
}

export function isNonWorking(
	iso: string,
	rule: PayRule = DEFAULT_PAY_RULE,
	holidays: readonly HolidayRef[] = []
): boolean {
	if (rule.weekendDays.includes(weekday(iso))) return true;
	return holidaysOn(iso, holidays, rule).length > 0;
}

/** Step backward or forward until the date is a working day. */
export function payDate(
	scheduled: string,
	rule: PayRule = DEFAULT_PAY_RULE,
	holidays: readonly HolidayRef[] = []
): string {
	const step = rule.shift === 'NEXT' ? 1 : -1;
	let current = scheduled;
	for (let guard = 0; guard < 366; guard += 1) {
		if (!isNonWorking(current, rule, holidays)) return current;
		current = addDays(current, step);
	}
	throw new Error(`Could not find a working day from ${scheduled}`);
}

export function arrivalReason(
	scheduled: string,
	actual: string,
	rule: PayRule = DEFAULT_PAY_RULE,
	holidays: readonly HolidayRef[] = []
): string | null {
	if (actual === scheduled) return null;
	const arrived = `${WEEKDAY_SHORT[weekday(actual)]} ${formatPaydayShort(actual)}`;
	const from = `${WEEKDAY_SHORT[weekday(scheduled)]} ${formatPaydayShort(scheduled)}`;
	const why = moveCause(scheduled, actual, rule, holidays);
	return `Arrives ${arrived} · moved from ${from} (${why})`;
}

export function yearSchedule(input: YearScheduleInput): ScheduleEntry[] {
	const rule = input.rule ?? DEFAULT_PAY_RULE;
	const holidays = input.holidays ?? [];
	const overrides = input.overrides ?? {};
	const locked = input.locked ?? {};
	const entries: ScheduleEntry[] = [];
	for (let month = 1; month <= 12; month += 1) {
		for (const slot of scheduledSlots(input.year, month, rule)) {
			entries.push(entryFor(input.year, month, slot, rule, holidays, overrides, locked));
		}
	}
	return entries;
}

export function nextScheduledOnOrAfter(
	iso: string,
	cadence: 'MID_MONTH' | 'MONTH_END',
	rule: PayRule = DEFAULT_PAY_RULE
): string {
	let { year, month } = fromIsoDate(iso);
	for (let i = 0; i < 24; i += 1) {
		const slot = scheduledSlots(year, month, rule).find((entry) => entry.cadence === cadence);
		if (slot && slot.scheduledDate >= iso) return slot.scheduledDate;
		const next = addMonths(year, month, 1);
		year = next.year;
		month = next.month;
	}
	throw new Error(`Could not find a ${cadence} payday on or after ${iso}`);
}

export function nextScheduledAfter(
	iso: string,
	cadence: 'MID_MONTH' | 'MONTH_END',
	rule: PayRule = DEFAULT_PAY_RULE
): string {
	return nextScheduledOnOrAfter(addDays(iso, 1), cadence, rule);
}

export function inferSlotCadence(iso: string, rule: PayRule = DEFAULT_PAY_RULE): PaydayCadence {
	const { year, month } = fromIsoDate(iso);
	const slot = scheduledSlots(year, month, rule).find((entry) => entry.scheduledDate === iso);
	return slot?.cadence ?? 'OTHER';
}

/** The scheduled payday that funds this due date, using the pay rule's days. */
export function fundScheduledDate(due: string, rule: PayRule = DEFAULT_PAY_RULE): string {
	const { year, month } = fromIsoDate(due);
	const slots = scheduledSlots(year, month, rule);
	const mid = slots.find((slot) => slot.cadence === 'MID_MONTH')?.scheduledDate;
	const end =
		slots.find((slot) => slot.cadence === 'MONTH_END')?.scheduledDate ?? slots[0]?.scheduledDate;
	if (end && due >= end) return end;
	if (mid && due >= mid) return mid;
	const prev = addMonths(year, month, -1);
	const previous = scheduledSlots(prev.year, prev.month, rule);
	return previous[previous.length - 1]?.scheduledDate ?? scheduledDate(prev.year, prev.month, 30);
}

function entryFor(
	year: number,
	month: number,
	slot: { cadence: 'MID_MONTH' | 'MONTH_END'; scheduledDate: string },
	rule: PayRule,
	holidays: readonly HolidayRef[],
	overrides: Readonly<Record<string, string>>,
	locked: Readonly<Record<string, string>>
): ScheduleEntry {
	const computedPayDate = payDate(slot.scheduledDate, rule, holidays);
	const lockedDate = locked[slot.scheduledDate];
	const override = overrides[slot.scheduledDate];
	const pay = lockedDate ?? override ?? computedPayDate;
	const overridden = lockedDate === undefined && override !== undefined;
	const reason = overridden
		? adjustedReason(slot.scheduledDate, pay)
		: arrivalReason(slot.scheduledDate, pay, rule, holidays);
	return {
		year,
		month,
		cadence: slot.cadence,
		scheduledDate: slot.scheduledDate,
		computedPayDate,
		payDate: pay,
		reason,
		overridden,
		locked: lockedDate !== undefined
	};
}

function adjustedReason(scheduled: string, actual: string): string | null {
	if (actual === scheduled) return 'Adjusted to the scheduled day';
	const arrived = `${WEEKDAY_SHORT[weekday(actual)]} ${formatPaydayShort(actual)}`;
	const from = `${WEEKDAY_SHORT[weekday(scheduled)]} ${formatPaydayShort(scheduled)}`;
	return `Arrives ${arrived} · adjusted from ${from}`;
}

function moveCause(
	scheduled: string,
	actual: string,
	rule: PayRule,
	holidays: readonly HolidayRef[]
): string {
	const names: string[] = [];
	let weekend = false;
	const step = rule.shift === 'NEXT' ? 1 : -1;
	let current = scheduled;
	for (let guard = 0; guard < 366 && current !== actual; guard += 1) {
		if (rule.weekendDays.includes(weekday(current))) weekend = true;
		for (const holiday of holidaysOn(current, holidays, rule)) {
			if (!names.includes(holiday.name)) names.push(holiday.name);
		}
		current = addDays(current, step);
	}
	const parts: string[] = [];
	if (weekend) parts.push('weekend');
	if (names.length > 0) parts.push(`holiday: ${names.join(', ')}`);
	return parts.join('; ') || 'non-working day';
}
