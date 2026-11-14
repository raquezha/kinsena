import { ensure } from './errors.ts';
import { MAX_CENTS } from './money.ts';
import type { Cents } from './models.ts';

export const MAX_EXPRESSION_LENGTH = 256;

const TERM = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d+))?$/;

export interface ParsedAmount {
	cents: Cents;
	/** The trimmed text the user typed; empty when the amount is blank. */
	expression: string;
}

interface ScaledTerm {
	digits: bigint;
	scale: number;
}

function parseTerm(raw: string): ScaledTerm {
	const term = raw.trim();
	const match = TERM.exec(term);
	ensure(match !== null, 'Enter an amount or add amounts with +');
	const fraction = match[1] ?? '';
	const whole = term.split('.')[0]?.replaceAll(',', '') ?? '0';
	return { digits: BigInt(whole + fraction), scale: fraction.length };
}

/** Sums exactly, then rounds half-up to two decimals, so 0.10 + 0.20 is 0.30. */
function sumToCents(terms: ScaledTerm[]): bigint {
	const scale = Math.max(2, ...terms.map((term) => term.scale));
	const total = terms.reduce(
		(sum, term) => sum + term.digits * 10n ** BigInt(scale - term.scale),
		0n
	);
	const divisor = 10n ** BigInt(scale - 2);
	const remainder = total % divisor;
	const roundUp = divisor > 1n && remainder * 2n >= divisor;
	return total / divisor + (roundUp ? 1n : 0n);
}

/**
 * Parses an amount like `1,500.25` or a sum like `10,538.91 + 3403` into cents.
 * Blank input is a blank amount (0 cents, empty expression), not an explicit zero.
 */
export function parseAmount(raw: string | null | undefined): ParsedAmount {
	const input = raw ?? '';
	if (input.trim() === '') return { cents: 0, expression: '' };
	ensure(input.length <= MAX_EXPRESSION_LENGTH, 'Amount is too long');
	const expression = input.trim();
	const cents = sumToCents(expression.split('+').map(parseTerm));
	ensure(cents <= BigInt(MAX_CENTS), 'Amount is too large');
	return { cents: Number(cents), expression };
}

/** Like parseAmount, but blank input means "no amount" (null). */
export function parseOptionalAmount(raw: string | null | undefined): Cents | null {
	const parsed = parseAmount(raw);
	return parsed.expression === '' ? null : parsed.cents;
}
