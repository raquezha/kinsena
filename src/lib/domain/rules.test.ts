import { describe, expect, it } from 'vitest';
import { cadenceMatches, isCadence } from './cadence.ts';
import { currencySymbol, isCurrencyCode } from './currency.ts';
import { localIsoDate } from './dates.ts';
import { DomainError } from './errors.ts';
import { hasKnownAmount } from './models.ts';
import { ensureMoney, normalizeName, normalizeNote, normalizeTitle } from './rules.ts';

describe('rules', () => {
	it('trims names and enforces 1 to 128 characters', () => {
		expect(normalizeName('  Rent ')).toBe('Rent');
		expect(normalizeName('x'.repeat(128))).toHaveLength(128);
		expect(() => normalizeName('   ')).toThrow(DomainError);
		expect(() => normalizeName('x'.repeat(129))).toThrow('Enter a name up to 128 characters');
	});

	it('defaults blank titles to the payday date', () => {
		expect(normalizeTitle('', '2026-10-15')).toBe('Payday 2026-10-15');
		expect(normalizeTitle(' October 15 ', '2026-10-15')).toBe('October 15');
		expect(() => normalizeTitle('x'.repeat(129), '2026-10-15')).toThrow('Title is too long');
	});

	it('removes blank notes and limits length', () => {
		expect(normalizeNote('  ')).toBeNull();
		expect(normalizeNote(null)).toBeNull();
		expect(normalizeNote(' Bonus payout ')).toBe('Bonus payout');
		expect(() => normalizeNote('x'.repeat(281))).toThrow('Keep the note under 280 characters');
	});

	it('accepts null or valid cents only', () => {
		expect(() => ensureMoney(null)).not.toThrow();
		expect(() => ensureMoney(100, 'salary')).not.toThrow();
		expect(() => ensureMoney(-1, 'salary')).toThrow('Invalid salary');
	});
});

describe('value helpers', () => {
	it('matches cadences', () => {
		expect(cadenceMatches('ANY', 'MID_MONTH')).toBe(true);
		expect(cadenceMatches('MONTH_END', 'ANY')).toBe(true);
		expect(cadenceMatches('MID_MONTH', 'MID_MONTH')).toBe(true);
		expect(cadenceMatches('MID_MONTH', 'MONTH_END')).toBe(false);
		expect(isCadence('MONTH_END')).toBe(true);
		expect(isCadence('WEEKLY')).toBe(false);
	});

	it('knows currencies', () => {
		expect(isCurrencyCode('USD')).toBe(true);
		expect(isCurrencyCode('INVALID')).toBe(false);
		expect(isCurrencyCode('toString')).toBe(false);
		expect(currencySymbol('PHP')).toBe('₱');
	});

	it('formats local dates and detects known amounts', () => {
		expect(localIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
		expect(hasKnownAmount({ amountExpr: ' 0 ' })).toBe(true);
		expect(hasKnownAmount({ amountExpr: null })).toBe(false);
	});
});
