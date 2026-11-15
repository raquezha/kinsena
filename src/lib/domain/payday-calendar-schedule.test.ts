import { describe, expect, it } from 'vitest';
import {
	nextScheduledAfter,
	nextScheduledOnOrAfter,
	payDate,
	yearSchedule
} from './payday-calendar.ts';
import { DEFAULT_PAY_RULE, type HolidayRef, type PayRule } from './pay-rule.ts';

function rule(overrides: Partial<PayRule> = {}): PayRule {
	return { ...DEFAULT_PAY_RULE, ...overrides };
}

describe('yearSchedule', () => {
	it('builds 24 paydays for a default year and shifts Nov 2026 correctly', () => {
		const holidays: HolidayRef[] = [
			{ date: '2026-11-30', name: 'Bonifacio Day', kind: 'NATIONAL' }
		];
		const schedule = yearSchedule({ year: 2026, holidays });
		expect(schedule).toHaveLength(24);
		const mid = schedule.find((entry) => entry.scheduledDate === '2026-11-15');
		const end = schedule.find((entry) => entry.scheduledDate === '2026-11-30');
		expect(mid).toMatchObject({
			payDate: '2026-11-13',
			computedPayDate: '2026-11-13',
			overridden: false,
			locked: false
		});
		expect(mid?.reason).toContain('Arrives Fri Nov 13');
		expect(end).toMatchObject({
			payDate: '2026-11-27',
			computedPayDate: '2026-11-27'
		});
		expect(end?.reason).toContain('holiday: Bonifacio Day');
		expect(end?.reason).toContain('weekend');
		expect(schedule.filter((entry) => entry.scheduledDate.startsWith('2026-02'))).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ scheduledDate: '2026-02-15' }),
				expect.objectContaining({ scheduledDate: '2026-02-28' })
			])
		);
	});

	it('keeps a locked received payday put, and applies an override otherwise', () => {
		const schedule = yearSchedule({
			year: 2026,
			overrides: { '2026-11-15': '2026-11-12' },
			locked: { '2026-11-30': '2026-11-30' }
		});
		const mid = schedule.find((entry) => entry.scheduledDate === '2026-11-15');
		const end = schedule.find((entry) => entry.scheduledDate === '2026-11-30');
		expect(mid).toMatchObject({
			payDate: '2026-11-12',
			computedPayDate: '2026-11-13',
			overridden: true,
			locked: false
		});
		expect(end).toMatchObject({
			payDate: '2026-11-30',
			overridden: false,
			locked: true
		});
	});

	it('uses custom days of the month', () => {
		const custom = rule({ daysOfMonth: [10, 25] });
		const schedule = yearSchedule({ year: 2026, rule: custom });
		expect(schedule[0]).toMatchObject({ scheduledDate: '2026-01-10', cadence: 'MID_MONTH' });
		expect(schedule[1]).toMatchObject({ scheduledDate: '2026-01-25', cadence: 'MONTH_END' });
		expect(schedule).toHaveLength(24);
	});

	it('does not move a payday that already falls on a working day', () => {
		expect(payDate('2026-11-13')).toBe('2026-11-13');
		const schedule = yearSchedule({ year: 2026 });
		const mid = schedule.find((entry) => entry.scheduledDate === '2026-07-15');
		// 15 Jul 2026 is Wednesday.
		expect(mid).toMatchObject({ payDate: '2026-07-15', reason: null });
	});
});

describe('next scheduled dates', () => {
	it('finds the next mid-month and month-end on or after a date', () => {
		expect(nextScheduledOnOrAfter('2026-11-15', 'MID_MONTH')).toBe('2026-11-15');
		expect(nextScheduledOnOrAfter('2026-11-16', 'MID_MONTH')).toBe('2026-12-15');
		expect(nextScheduledOnOrAfter('2026-11-01', 'MONTH_END')).toBe('2026-11-30');
		expect(nextScheduledAfter('2026-11-30', 'MONTH_END')).toBe('2026-12-30');
		expect(nextScheduledAfter('2026-12-30', 'MONTH_END')).toBe('2027-01-30');
	});
});
