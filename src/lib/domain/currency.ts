export const CURRENCIES = {
	PHP: { label: 'Philippine peso', symbol: '₱' },
	USD: { label: 'US dollar', symbol: '$' },
	EUR: { label: 'Euro', symbol: '€' },
	GBP: { label: 'British pound', symbol: '£' },
	JPY: { label: 'Japanese yen', symbol: '¥' },
	AUD: { label: 'Australian dollar', symbol: 'A$' },
	CAD: { label: 'Canadian dollar', symbol: 'C$' },
	SGD: { label: 'Singapore dollar', symbol: 'S$' },
	HKD: { label: 'Hong Kong dollar', symbol: 'HK$' }
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export const DEFAULT_CURRENCY: CurrencyCode = 'PHP';

export function isCurrencyCode(value: string): value is CurrencyCode {
	return Object.hasOwn(CURRENCIES, value);
}

export function currencySymbol(code: CurrencyCode): string {
	return CURRENCIES[code].symbol;
}
