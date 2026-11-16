import { isCatalogIconKey } from '../domain/recurring-catalog.ts';
import { ensure } from '../domain/errors.ts';
import { isBrandIconValue } from '../domain/template-icon.ts';
import { isKnownBrandKey } from './brand-icon.ts';

/** Normalize form/icon input to null | category key | brand:<key>. */
export function parseStoredIcon(raw: string | null | undefined): string | null {
	const text = (raw ?? '').trim();
	if (text === '' || text.toLowerCase() === 'auto') return null;
	if (isBrandIconValue(text)) {
		const key = text.slice(6);
		ensure(isKnownBrandKey(key), 'Unknown brand icon');
		return `brand:${key}`;
	}
	ensure(isCatalogIconKey(text), 'Unknown category icon');
	return text;
}
