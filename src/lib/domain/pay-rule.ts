/** Configurable payday rule: which dates, how to shift, what is non-working. */

export const SHIFT_DIRECTIONS = ['PREVIOUS', 'NEXT'] as const;
export type ShiftDirection = (typeof SHIFT_DIRECTIONS)[number];

export const HOLIDAY_KINDS = ['NATIONAL', 'LOCAL'] as const;
export type HolidayKind = (typeof HOLIDAY_KINDS)[number];

/** Sunday is 0, Saturday is 6 — same as Date#getDay(). */
export const WEEKDAY_INDEXES = [0, 1, 2, 3, 4, 5, 6] as const;
export type WeekdayIndex = (typeof WEEKDAY_INDEXES)[number];

export const WEEKDAY_LABELS: Record<WeekdayIndex, string> = {
	0: 'Sunday',
	1: 'Monday',
	2: 'Tuesday',
	3: 'Wednesday',
	4: 'Thursday',
	5: 'Friday',
	6: 'Saturday'
};

export const WEEKDAY_SHORT: Record<WeekdayIndex, string> = {
	0: 'Sun',
	1: 'Mon',
	2: 'Tue',
	3: 'Wed',
	4: 'Thu',
	5: 'Fri',
	6: 'Sat'
};

export const SHORT_MONTH_POLICIES = ['LAST_DAY'] as const;
export type ShortMonthPolicy = (typeof SHORT_MONTH_POLICIES)[number];

export interface PayRule {
	/** Two calendar days, earlier first. Default 15 and 30. */
	daysOfMonth: [number, number];
	/** When a day does not exist in a month (Feb 30), use the last day. */
	shortMonthPolicy: ShortMonthPolicy;
	shift: ShiftDirection;
	weekendDays: WeekdayIndex[];
	includeNationalHolidays: boolean;
	includeLocalHolidays: boolean;
}

export const DEFAULT_PAY_RULE: PayRule = {
	daysOfMonth: [15, 30],
	shortMonthPolicy: 'LAST_DAY',
	shift: 'PREVIOUS',
	weekendDays: [0, 6],
	includeNationalHolidays: true,
	includeLocalHolidays: true
};

export function isShiftDirection(value: string): value is ShiftDirection {
	return (SHIFT_DIRECTIONS as readonly string[]).includes(value);
}

export function isHolidayKind(value: string): value is HolidayKind {
	return (HOLIDAY_KINDS as readonly string[]).includes(value);
}

export function isWeekdayIndex(value: number): value is WeekdayIndex {
	return Number.isInteger(value) && value >= 0 && value <= 6;
}

export interface HolidayRef {
	date: string;
	name: string;
	kind: HolidayKind;
}

export function sortDaysOfMonth(days: readonly number[]): [number, number] | null {
	if (days.length !== 2) return null;
	const [first, second] = days;
	if (first === undefined || second === undefined) return null;
	if (!isDayOfMonth(first) || !isDayOfMonth(second) || first === second) return null;
	return first < second ? [first, second] : [second, first];
}

export function isDayOfMonth(value: number): boolean {
	return Number.isInteger(value) && value >= 1 && value <= 31;
}

export function normalizePayRule(input: Partial<PayRule> | null | undefined): PayRule {
	const days = sortDaysOfMonth(input?.daysOfMonth ?? DEFAULT_PAY_RULE.daysOfMonth);
	const weekends = uniqueWeekdays(input?.weekendDays ?? DEFAULT_PAY_RULE.weekendDays);
	return {
		daysOfMonth: days ?? DEFAULT_PAY_RULE.daysOfMonth,
		shortMonthPolicy: 'LAST_DAY',
		shift: input?.shift === 'NEXT' ? 'NEXT' : 'PREVIOUS',
		weekendDays: weekends,
		includeNationalHolidays: input?.includeNationalHolidays ?? true,
		includeLocalHolidays: input?.includeLocalHolidays ?? true
	};
}

export function parseDaysOfMonth(text: string): [number, number] | null {
	const days = text
		.split(/[,\s]+/)
		.map((part) => part.trim())
		.filter((part) => part !== '')
		.map(Number);
	return sortDaysOfMonth(days);
}

export function parseWeekendDays(text: string): WeekdayIndex[] | null {
	if (text.trim() === '') return [];
	const days = text
		.split(/[,\s]+/)
		.map((part) => part.trim())
		.filter((part) => part !== '')
		.map(Number);
	if (days.some((day) => !isWeekdayIndex(day))) return null;
	return uniqueWeekdays(days);
}

export function formatDaysOfMonth(days: readonly number[]): string {
	return days.join(', ');
}

export function formatWeekendDays(days: readonly WeekdayIndex[]): string {
	return days.join(',');
}

function uniqueWeekdays(values: readonly number[]): WeekdayIndex[] {
	const unique = [...new Set(values.filter(isWeekdayIndex))].sort((left, right) => left - right);
	return unique;
}
