import { describe, expect, it } from 'vitest';
import {
	DEFAULT_PAY_RULE,
	formatDaysOfMonth,
	formatWeekendDays,
	isHolidayKind,
	isShiftDirection,
	isWeekdayIndex,
	normalizePayRule,
	sortDaysOfMonth,
	parseDaysOfMonth,
	parseWeekendDays
} from './pay-rule.ts';

describe('pay rule', () => {
	it('parses and sorts two pay days of the month', () => {
		expect(parseDaysOfMonth('30, 15')).toEqual([15, 30]);
		expect(parseDaysOfMonth('15 15')).toBeNull();
		expect(parseDaysOfMonth('15')).toBeNull();
		expect(parseDaysOfMonth('0, 15')).toBeNull();
		expect(formatDaysOfMonth([15, 30])).toBe('15, 30');
	});

	it('parses weekend day indexes', () => {
		expect(parseWeekendDays('6, 0, 6')).toEqual([0, 6]);
		expect(parseWeekendDays('')).toEqual([]);
		expect(parseWeekendDays('9')).toBeNull();
		expect(formatWeekendDays([0, 6])).toBe('0,6');
	});

	it('guards shift, holiday kind, and weekday values', () => {
		expect(isShiftDirection('PREVIOUS')).toBe(true);
		expect(isShiftDirection('SIDEWAYS')).toBe(false);
		expect(isHolidayKind('LOCAL')).toBe(true);
		expect(isHolidayKind('REGIONAL')).toBe(false);
		expect(isWeekdayIndex(0)).toBe(true);
		expect(isWeekdayIndex(6)).toBe(true);
		expect(isWeekdayIndex(7)).toBe(false);
		expect(isWeekdayIndex(1.5)).toBe(false);
	});

	it('normalizes a partial rule back to defaults', () => {
		expect(normalizePayRule(null)).toEqual(DEFAULT_PAY_RULE);
		expect(normalizePayRule({ shift: 'NEXT', daysOfMonth: [25, 10] })).toMatchObject({
			shift: 'NEXT',
			daysOfMonth: [10, 25],
			weekendDays: [0, 6]
		});
		expect(normalizePayRule({ daysOfMonth: [15, 15] }).daysOfMonth).toEqual([15, 30]);
		expect(sortDaysOfMonth([15, undefined as unknown as number])).toBeNull();
	});
});
