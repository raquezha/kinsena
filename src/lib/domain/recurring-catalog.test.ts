import { describe, expect, it } from 'vitest';
import {
	catalogIconLabel,
	filterCatalogIcons,
	isCatalogIconKey,
	PRIMARY_CATALOG_KEYS
} from './recurring-catalog.ts';

describe('recurring-catalog', () => {
	it('looks up keys and labels', () => {
		expect(isCatalogIconKey('zap')).toBe(true);
		expect(isCatalogIconKey('nope')).toBe(false);
		expect(catalogIconLabel('zap')).toBeTruthy();
		expect(catalogIconLabel('missing')).toBe('missing');
	});

	it('returns primary icons first when the query is empty', () => {
		const empty = filterCatalogIcons('   ');
		expect(empty.slice(0, PRIMARY_CATALOG_KEYS.length).map((entry) => entry.key)).toEqual([
			...PRIMARY_CATALOG_KEYS
		]);
		expect(empty.length).toBeGreaterThan(PRIMARY_CATALOG_KEYS.length);
	});

	it('filters by key, label, and keywords', () => {
		expect(filterCatalogIcons('wifi').some((entry) => entry.key === 'wifi')).toBe(true);
		expect(filterCatalogIcons('electric').length).toBeGreaterThan(0);
		expect(filterCatalogIcons('zzzz-no-match')).toEqual([]);
	});
});
