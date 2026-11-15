import { describe, expect, it } from 'vitest';
import {
	compareIsoDate,
	dueDateInMonth,
	formatPaydayTitle,
	fromIsoDate,
	fundPaydayDate,
	inferCadence,
	isIsoDate,
	lastDayOfMonth,
	midMonthAfter,
	midMonthOnOrAfter,
	monthEndAfter,
	monthEndOnOrAfter,
	paydayAfter,
	nextPaydayDate,
	toIsoDate
} from './calendar.ts';

describe('calendar dates', () => {
	it('parses, formats and rejects invalid calendar dates', () => {
		expect(fromIsoDate('2026-02-28')).toEqual({ year: 2026, month: 2, day: 28 });
		expect(toIsoDate({ year: 2026, month: 1, day: 5 })).toBe('2026-01-05');
		expect(isIsoDate('2026-11-15')).toBe(true);
		expect(isIsoDate('2026-02-29')).toBe(false);
		expect(isIsoDate('2026-13-01')).toBe(false);
		expect(isIsoDate('15/11/2026')).toBe(false);
		expect(() => fromIsoDate('2026-11-31')).toThrow('Invalid date');
		expect(lastDayOfMonth(2026, 2)).toBe(28);
		expect(lastDayOfMonth(2028, 2)).toBe(29);
		expect(lastDayOfMonth(2026, 11)).toBe(30);
		expect(dueDateInMonth(2026, 11, 31)).toBe('2026-11-30');
		expect(dueDateInMonth(2026, 1, 1)).toBe('2026-01-01');
		expect(compareIsoDate('2026-11-15', '2026-11-30')).toBe(-1);
		expect(compareIsoDate('2026-11-15', '2026-11-15')).toBe(0);
	});

	it('infers cadence from the day of the month', () => {
		expect(inferCadence('2026-11-15')).toBe('MID_MONTH');
		expect(inferCadence('2026-11-30')).toBe('MONTH_END');
		expect(inferCadence('2026-02-28')).toBe('MONTH_END');
		expect(inferCadence('2028-02-29')).toBe('MONTH_END');
		expect(inferCadence('2026-11-14')).toBe('OTHER');
		expect(formatPaydayTitle('2026-11-15')).toBe('November 15');
		expect(formatPaydayTitle('2026-11-30')).toBe('November 30');
	});

	it('finds the next 15th and last day of the month', () => {
		expect(midMonthOnOrAfter('2026-11-01')).toBe('2026-11-15');
		expect(midMonthOnOrAfter('2026-11-15')).toBe('2026-11-15');
		expect(midMonthOnOrAfter('2026-11-16')).toBe('2026-12-15');
		expect(midMonthOnOrAfter('2026-12-20')).toBe('2027-01-15');
		expect(monthEndOnOrAfter('2026-11-01')).toBe('2026-11-30');
		expect(monthEndOnOrAfter('2026-11-30')).toBe('2026-11-30');
		expect(midMonthAfter('2026-11-14')).toBe('2026-11-15');
		expect(midMonthAfter('2026-11-15')).toBe('2026-12-15');
		expect(monthEndAfter('2026-11-29')).toBe('2026-11-30');
		expect(monthEndAfter('2026-11-30')).toBe('2026-12-31');
		expect(monthEndAfter('2026-12-31')).toBe('2027-01-31');
		expect(nextPaydayDate('2026-11-15', 'MID_MONTH')).toBe('2026-11-15');
		expect(paydayAfter('2026-11-15', 'MID_MONTH')).toBe('2026-12-15');
		expect(paydayAfter('2026-11-15', 'MONTH_END')).toBe('2026-11-30');
	});

	it('picks the payday that funds a due date', () => {
		expect(fundPaydayDate('2026-11-20')).toBe('2026-11-15');
		expect(fundPaydayDate('2026-11-15')).toBe('2026-11-15');
		expect(fundPaydayDate('2026-11-30')).toBe('2026-11-30');
		expect(fundPaydayDate('2026-11-05')).toBe('2026-10-31');
		expect(fundPaydayDate('2026-12-01')).toBe('2026-11-30');
		expect(fundPaydayDate('2026-02-28')).toBe('2026-02-28');
		expect(fundPaydayDate('2028-02-29')).toBe('2028-02-29');
	});
});
