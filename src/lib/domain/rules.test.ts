import { describe, expect, it } from 'vitest';
import { isPaydayCadence, isScheduledCadence } from './cadence.ts';
import { currencySymbol, isCurrencyCode } from './currency.ts';
import { localIsoDate } from './dates.ts';
import { isDecision } from './decision.ts';
import { isDestinationKind } from './destination.ts';
import { DomainError } from './errors.ts';
import { isFundFrom } from './fund-from.ts';
import { hasKnownAmount } from './models.ts';
import {
	ensureMoney,
	normalizeDate,
	normalizeDueDay,
	normalizeName,
	normalizeNote,
	normalizeOptionalDate,
	normalizeTitle
} from './rules.ts';

describe('rules', () => {
	it('trims names and enforces 1 to 128 characters', () => {
		expect(normalizeName('  Rent ')).toBe('Rent');
		expect(normalizeName('x'.repeat(128))).toHaveLength(128);
		expect(() => normalizeName('   ')).toThrow(DomainError);
		expect(() => normalizeName('x'.repeat(129))).toThrow('Enter a name up to 128 characters');
	});

	it('defaults blank titles to the scheduled payday', () => {
		expect(normalizeTitle('', '2026-10-15')).toBe('October 15');
		expect(normalizeTitle(' Mid-month bonus ', '2026-10-15')).toBe('Mid-month bonus');
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

	it('validates calendar dates and due days', () => {
		expect(normalizeDate('2026-11-15')).toBe('2026-11-15');
		expect(() => normalizeDate('2026-11-31', 'due date')).toThrow('Enter a valid due date');
		expect(normalizeOptionalDate('  ')).toBeNull();
		expect(normalizeOptionalDate('2026-11-30')).toBe('2026-11-30');
		expect(normalizeDueDay(null)).toBeNull();
		expect(normalizeDueDay(31)).toBe(31);
		expect(() => normalizeDueDay(0)).toThrow('Due day must be between 1 and 31');
	});
});

describe('value helpers', () => {
	it('recognises domain enums', () => {
		expect(isPaydayCadence('MONTH_END')).toBe(true);
		expect(isPaydayCadence('ANY')).toBe(false);
		expect(isScheduledCadence('MID_MONTH')).toBe(true);
		expect(isScheduledCadence('OTHER')).toBe(false);
		expect(isFundFrom('EVERY')).toBe(true);
		expect(isFundFrom('ANY')).toBe(false);
		expect(isDecision('FULL')).toBe(true);
		expect(isDecision('PAID')).toBe(false);
		expect(isDestinationKind('ACCOUNT')).toBe(true);
		expect(isDestinationKind('BANK')).toBe(false);
	});

	it('knows currencies', () => {
		expect(isCurrencyCode('USD')).toBe(true);
		expect(isCurrencyCode('INVALID')).toBe(false);
		expect(isCurrencyCode('toString')).toBe(false);
		expect(currencySymbol('PHP')).toBe('₱');
	});

	it('formats local dates and detects known amounts', () => {
		expect(localIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
		expect(hasKnownAmount({ fullAmountExpr: ' 0 ' })).toBe(true);
		expect(hasKnownAmount({ fullAmountExpr: null })).toBe(false);
	});
});
