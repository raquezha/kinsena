import { describe, expect, it } from 'vitest';
import { parseAmount, parseOptionalAmount } from './amount-parser.ts';
import { DomainError } from './errors.ts';
import { formatEdit } from './money.ts';

describe('parseAmount', () => {
	it.each([
		['0.29', 29],
		['1.15', 115],
		['10,538.91 + 3403', 1_394_191],
		['0.10 + 0.20', 30],
		['4814.625', 481_463],
		['4814.624', 481_462],
		['0.005 + 0.005', 1],
		['75000', 7_500_000],
		['1,000,000.5', 100_000_050],
		['999999999999.99', 99_999_999_999_999]
	])('parses %s as %i cents', (raw, cents) => {
		expect(parseAmount(raw).cents).toBe(cents);
	});

	it('keeps the trimmed expression the user typed', () => {
		expect(parseAmount('  10 + 5 ')).toEqual({ cents: 1500, expression: '10 + 5' });
	});

	it('treats blank as blank, and zero as an explicit zero', () => {
		expect(parseAmount(' ')).toEqual({ cents: 0, expression: '' });
		expect(parseAmount(null)).toEqual({ cents: 0, expression: '' });
		expect(parseAmount('0')).toEqual({ cents: 0, expression: '0' });
	});

	it.each([
		'1000 + typo',
		'1 +',
		'-1',
		'1e10',
		'NaN',
		'Infinity',
		'1,23',
		'1 + + 2',
		'9999999999999',
		'0. ',
		'2,00,000',
		'50.000,00',
		'1'.repeat(257)
	])('rejects %s without saving anything', (raw) => {
		expect(() => parseAmount(raw)).toThrow(DomainError);
	});

	it('round-trips the edit format', () => {
		for (const cents of [0, 29, 7_500_000, 1_850_050]) {
			expect(parseAmount(formatEdit(cents)).cents).toBe(cents);
		}
	});
});

describe('parseOptionalAmount', () => {
	it('returns null for blank and cents otherwise', () => {
		expect(parseOptionalAmount('')).toBeNull();
		expect(parseOptionalAmount(undefined)).toBeNull();
		expect(parseOptionalAmount('0')).toBe(0);
		expect(parseOptionalAmount('18500.50')).toBe(1_850_050);
	});
});
