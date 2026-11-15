import { describe, expect, it } from 'vitest';
import { dueDateForPayday, isFundFrom, templateFitsPayday } from './fund-from.ts';

describe('template assignment', () => {
	const mid = { cadence: 'MID_MONTH' as const, scheduledDate: '2026-11-15' };
	const end = { cadence: 'MONTH_END' as const, scheduledDate: '2026-11-30' };
	const other = { cadence: 'OTHER' as const, scheduledDate: '2026-11-20' };

	it('puts mid-month and month-end rules on the matching payday', () => {
		expect(templateFitsPayday({ fundFrom: 'MID_MONTH', dueDay: null }, mid)).toBe(true);
		expect(templateFitsPayday({ fundFrom: 'MID_MONTH', dueDay: null }, end)).toBe(false);
		expect(templateFitsPayday({ fundFrom: 'MONTH_END', dueDay: 31 }, end)).toBe(true);
		expect(templateFitsPayday({ fundFrom: 'EVERY', dueDay: null }, mid)).toBe(true);
		expect(templateFitsPayday({ fundFrom: 'EVERY', dueDay: null }, end)).toBe(true);
		expect(templateFitsPayday({ fundFrom: 'EVERY', dueDay: null }, other)).toBe(false);
		expect(isFundFrom('BEFORE_DUE')).toBe(true);
	});

	it('assigns BEFORE_DUE items to the payday that funds the due date', () => {
		expect(dueDateForPayday({ fundFrom: 'BEFORE_DUE', dueDay: 20 }, mid)).toBe('2026-11-20');
		expect(dueDateForPayday({ fundFrom: 'BEFORE_DUE', dueDay: 20 }, end)).toBeNull();
		expect(dueDateForPayday({ fundFrom: 'BEFORE_DUE', dueDay: 5 }, mid)).toBeNull();
		expect(dueDateForPayday({ fundFrom: 'BEFORE_DUE', dueDay: 5 }, end)).toBe('2026-12-05');
		expect(dueDateForPayday({ fundFrom: 'BEFORE_DUE', dueDay: 30 }, end)).toBe('2026-11-30');
		expect(dueDateForPayday({ fundFrom: 'BEFORE_DUE', dueDay: null }, mid)).toBeNull();
		expect(dueDateForPayday({ fundFrom: 'MID_MONTH', dueDay: 18 }, mid)).toBe('2026-11-18');
	});
});
