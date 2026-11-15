import { currencySymbol, type CurrencyCode } from './currency.ts';
import type { Cents } from './models.ts';

/** Largest storable amount: 999,999,999,999.99 */
export const MAX_CENTS: Cents = 99_999_999_999_999;

const grouping = new Intl.NumberFormat('en-US', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

export function isValidCents(value: number): boolean {
	return Number.isSafeInteger(value) && value >= 0 && value <= MAX_CENTS;
}

/** "75,000.00" — US grouping and dot decimal, independent of the browser locale. */
export function formatPlain(cents: Cents): string {
	return grouping.format(cents / 100);
}

/** "₱75,000.00", or "-₱1.00" for negative balances. */
export function formatMoney(cents: Cents, currency: CurrencyCode): string {
	const sign = cents < 0 ? '-' : '';
	return `${sign}${currencySymbol(currency)}${formatPlain(Math.abs(cents))}`;
}

/** "75,000.00" — grouped thousands for edit fields; parses back to the same cents. */
export function formatEdit(cents: Cents): string {
	return formatPlain(cents);
}

/** Splits "56,499.50" into "56,499" and "50" so the cents can be styled smaller. */
export function splitMoney(cents: Cents): { whole: string; fraction: string } {
	const [whole = '0', fraction = '00'] = formatPlain(Math.abs(cents)).split('.');
	return { whole: cents < 0 ? `-${whole}` : whole, fraction };
}
