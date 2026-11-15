import { describe, expect, it } from 'vitest';
import {
	addDays,
	arrivalReason,
	fundScheduledDate,
	inferSlotCadence,
	isNonWorking,
	payDate,
	scheduledDate,
	scheduledSlots,
	weekday
} from './payday-calendar.ts';
import { DEFAULT_PAY_RULE, type HolidayRef, type PayRule } from './pay-rule.ts';

function rule(overrides: Partial<PayRule> = {}): PayRule {
	return { ...DEFAULT_PAY_RULE, ...overrides };
}

function holiday(date: string, name: string, kind: HolidayRef['kind'] = 'NATIONAL'): HolidayRef {
	return { date, name, kind };
}

describe('scheduled dates', () => {
	it('uses the 15th and 30th, and the last day when the month is shorter', () => {
		expect(scheduledDate(2026, 11, 15)).toBe('2026-11-15');
		expect(scheduledDate(2026, 11, 30)).toBe('2026-11-30');
		expect(scheduledDate(2026, 2, 30)).toBe('2026-02-28');
		expect(scheduledDate(2028, 2, 30)).toBe('2028-02-29');
		expect(scheduledDate(2027, 1, 30)).toBe('2027-01-30');
		expect(scheduledSlots(2026, 2)).toEqual([
			{ cadence: 'MID_MONTH', scheduledDate: '2026-02-15' },
			{ cadence: 'MONTH_END', scheduledDate: '2026-02-28' }
		]);
	});

	it('collapses both days onto one date in a short month', () => {
		const tight = rule({ daysOfMonth: [30, 31] });
		expect(scheduledSlots(2026, 2, tight)).toEqual([
			{ cadence: 'MONTH_END', scheduledDate: '2026-02-28' }
		]);
	});

	it('infers cadence from the rule, not the last calendar day', () => {
		expect(inferSlotCadence('2026-11-15')).toBe('MID_MONTH');
		expect(inferSlotCadence('2026-11-30')).toBe('MONTH_END');
		expect(inferSlotCadence('2026-12-30')).toBe('MONTH_END');
		expect(inferSlotCadence('2026-12-31')).toBe('OTHER');
		expect(inferSlotCadence('2026-02-28')).toBe('MONTH_END');
	});
});

describe('payDate shift', () => {
	it('steps back over a weekend', () => {
		// 15 Nov 2026 is Sunday.
		expect(weekday('2026-11-15')).toBe(0);
		expect(payDate('2026-11-15')).toBe('2026-11-13');
		expect(arrivalReason('2026-11-15', '2026-11-13')).toBe(
			'Arrives Fri Nov 13 · moved from Sun Nov 15 (weekend)'
		);
	});

	it('steps forward when the rule says next', () => {
		expect(payDate('2026-11-15', rule({ shift: 'NEXT' }))).toBe('2026-11-16');
	});

	it('steps back through a chain of holidays to the previous working day', () => {
		// 15th is Friday; Wed/Thu/Fri are holidays → Tuesday the 12th.
		// 15 Jan 2027 is Friday; Wed/Thu/Fri are holidays → Tuesday the 12th.
		const holidays = [
			holiday('2027-01-13', 'Local A', 'LOCAL'),
			holiday('2027-01-14', 'Local B', 'LOCAL'),
			holiday('2027-01-15', 'Local C', 'LOCAL')
		];
		expect(weekday('2027-01-15')).toBe(5);
		expect(payDate('2027-01-15', rule(), holidays)).toBe('2027-01-12');
		expect(arrivalReason('2027-01-15', '2027-01-12', rule(), holidays)).toBe(
			'Arrives Tue Jan 12 · moved from Fri Jan 15 (holiday: Local C, Local B, Local A)'
		);
	});

	it('can step into the previous month when the 1st is non-working', () => {
		const holidays = [holiday('2027-01-01', "New Year's Day")];
		expect(payDate('2027-01-01', rule(), holidays)).toBe('2026-12-31');
	});

	it('ignores local holidays when the rule excludes them', () => {
		const holidays = [holiday('2026-11-13', 'Town fiesta', 'LOCAL')];
		const closed = rule({ includeLocalHolidays: false });
		// 15 Nov 2026 Sunday → Friday 13, but 13 is a local holiday we are ignoring.
		expect(payDate('2026-11-15', closed, holidays)).toBe('2026-11-13');
		expect(isNonWorking('2026-11-13', closed, holidays)).toBe(false);
	});

	it('treats a Saturday as working when weekends are only Sunday', () => {
		const sundayOnly = rule({ weekendDays: [0] });
		expect(payDate('2026-11-14', sundayOnly)).toBe('2026-11-14');
		expect(payDate('2026-11-15', sundayOnly)).toBe('2026-11-14');
	});

	it('does not treat a special working day as a holiday', () => {
		expect(isNonWorking('2026-02-25')).toBe(false);
		expect(payDate('2026-02-25')).toBe('2026-02-25');
	});
});

describe('fundScheduledDate', () => {
	it('funds mid-month, month-end on the 30th, and the previous 30th before mid-month', () => {
		expect(fundScheduledDate('2026-11-20')).toBe('2026-11-15');
		expect(fundScheduledDate('2026-11-30')).toBe('2026-11-30');
		expect(fundScheduledDate('2027-01-31')).toBe('2027-01-30');
		expect(fundScheduledDate('2026-11-05')).toBe('2026-10-30');
	});
});

describe('addDays', () => {
	it('crosses month and year boundaries', () => {
		expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
	});
});

describe('payDate exhausts the calendar', () => {
	it('throws when every day is non-working', () => {
		expect(() => payDate('2026-01-01', rule({ weekendDays: [0, 1, 2, 3, 4, 5, 6] }))).toThrow(
			'Could not find a working day from 2026-01-01'
		);
	});
});
