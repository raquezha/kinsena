import { describe, expect, it } from 'vitest';
import {
	formatEdit,
	formatMoney,
	formatPlain,
	isValidCents,
	MAX_CENTS,
	splitMoney
} from './money.ts';

describe('money formatting', () => {
	it('uses US grouping and a dot decimal', () => {
		expect(formatPlain(7_500_000)).toBe('75,000.00');
		expect(formatPlain(29)).toBe('0.29');
		expect(formatPlain(139_419)).toBe('1,394.19');
	});

	it('prefixes the currency symbol and handles negatives', () => {
		expect(formatMoney(2_500, 'PHP')).toBe('₱25.00');
		expect(formatMoney(29, 'USD')).toBe('$0.29');
		expect(formatMoney(-100, 'HKD')).toBe('-HK$1.00');
	});

	it('formats edit values without grouping', () => {
		expect(formatEdit(7_500_000)).toBe('75000.00');
		expect(formatEdit(29)).toBe('0.29');
		expect(formatEdit(5)).toBe('0.05');
	});

	it('splits whole and fraction parts', () => {
		expect(splitMoney(5_649_950)).toEqual({ whole: '56,499', fraction: '50' });
		expect(splitMoney(-150)).toEqual({ whole: '-1', fraction: '50' });
	});

	it('validates the storable range', () => {
		expect(isValidCents(0)).toBe(true);
		expect(isValidCents(MAX_CENTS)).toBe(true);
		expect(isValidCents(MAX_CENTS + 1)).toBe(false);
		expect(isValidCents(-1)).toBe(false);
		expect(isValidCents(1.5)).toBe(false);
	});
});
