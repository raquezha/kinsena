/** Pure calendar rules for Filipino kinsenas: the 15th and month-end. */

const MONTHS_SHORT = [
	'JAN',
	'FEB',
	'MAR',
	'APR',
	'MAY',
	'JUN',
	'JUL',
	'AUG',
	'SEP',
	'OCT',
	'NOV',
	'DEC'
] as const;

const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
] as const;

export interface Ymd {
	year: number;
	month: number;
	day: number;
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function pad2(value: number): string {
	return String(value).padStart(2, '0');
}

export function toIsoDate({ year, month, day }: Ymd): string {
	return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Reads a calendar date. Invalid strings throw. */
export function fromIsoDate(iso: string): Ymd {
	const match = ISO.exec(iso);
	if (!match) throw new Error(`Invalid date: ${iso}`);
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const last = lastDayOfMonth(year, month);
	if (month < 1 || month > 12 || day < 1 || day > last) {
		throw new Error(`Invalid date: ${iso}`);
	}
	return { year, month, day };
}

export function isIsoDate(value: string): boolean {
	try {
		fromIsoDate(value);
		return true;
	} catch {
		return false;
	}
}

export function lastDayOfMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

export function addMonths(year: number, month: number, delta: number): Pick<Ymd, 'year' | 'month'> {
	const index = year * 12 + (month - 1) + delta;
	return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** Clamps a due day (1–31) to a real calendar date in that month. */
export function dueDateInMonth(year: number, month: number, dueDay: number): string {
	const last = lastDayOfMonth(year, month);
	return toIsoDate({ year, month, day: Math.min(Math.max(dueDay, 1), last) });
}

export type PaydayCadence = 'MID_MONTH' | 'MONTH_END' | 'OTHER';

/** 15th is mid-month, last day is month-end, anything else is OTHER. */
export function inferCadence(iso: string): PaydayCadence {
	const { year, month, day } = fromIsoDate(iso);
	if (day === 15) return 'MID_MONTH';
	if (day === lastDayOfMonth(year, month)) return 'MONTH_END';
	return 'OTHER';
}

/** The 15th on or after this calendar date. */
export function midMonthOnOrAfter(iso: string): string {
	const { year, month, day } = fromIsoDate(iso);
	if (day <= 15) return toIsoDate({ year, month, day: 15 });
	const next = addMonths(year, month, 1);
	return toIsoDate({ year: next.year, month: next.month, day: 15 });
}

/** The last day of the month on or after this calendar date. */
export function monthEndOnOrAfter(iso: string): string {
	const { year, month } = fromIsoDate(iso);
	return toIsoDate({ year, month, day: lastDayOfMonth(year, month) });
}

/** The 15th strictly after this calendar date. */
export function midMonthAfter(iso: string): string {
	const { year, month, day } = fromIsoDate(iso);
	if (day < 15) return toIsoDate({ year, month, day: 15 });
	const next = addMonths(year, month, 1);
	return toIsoDate({ year: next.year, month: next.month, day: 15 });
}

/** The month-end strictly after this calendar date. */
export function monthEndAfter(iso: string): string {
	const { year, month, day } = fromIsoDate(iso);
	const last = lastDayOfMonth(year, month);
	if (day < last) return toIsoDate({ year, month, day: last });
	const next = addMonths(year, month, 1);
	return toIsoDate({
		year: next.year,
		month: next.month,
		day: lastDayOfMonth(next.year, next.month)
	});
}

export function nextPaydayDate(iso: string, cadence: 'MID_MONTH' | 'MONTH_END'): string {
	return cadence === 'MID_MONTH' ? midMonthOnOrAfter(iso) : monthEndOnOrAfter(iso);
}

export function paydayAfter(iso: string, cadence: 'MID_MONTH' | 'MONTH_END'): string {
	return cadence === 'MID_MONTH' ? midMonthAfter(iso) : monthEndAfter(iso);
}

/**
 * The kinsena that funds a due date: that month's 15th if the due date is
 * after the 15th and before month-end, that month-end if it falls on the
 * last day, or the previous month-end if it falls before the 15th.
 */
export function fundPaydayDate(due: string): string {
	const { year, month, day } = fromIsoDate(due);
	const last = lastDayOfMonth(year, month);
	if (day === last) return toIsoDate({ year, month, day: last });
	if (day >= 15) return toIsoDate({ year, month, day: 15 });
	const prev = addMonths(year, month, -1);
	return toIsoDate({
		year: prev.year,
		month: prev.month,
		day: lastDayOfMonth(prev.year, prev.month)
	});
}

/** "November 15", "November 30". */
export function formatPaydayTitle(iso: string): string {
	const { month, day } = fromIsoDate(iso);
	return `${MONTHS[month - 1]} ${day}`;
}

/** Jeepney route-board shorthand: "NOV 15". */
export function formatRouteSign(iso: string): string {
	const { month, day } = fromIsoDate(iso);
	return `${MONTHS_SHORT[month - 1]} ${day}`;
}

export function compareIsoDate(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}
