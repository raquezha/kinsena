import { describe, expect, it } from 'vitest';
import { brandKeyFromIcon, encodeBrandIcon, isBrandIconValue } from './template-icon.ts';

describe('template-icon', () => {
	it('detects, encodes, and extracts brand keys', () => {
		expect(isBrandIconValue('brand:bdo')).toBe(true);
		expect(isBrandIconValue('brand:')).toBe(false);
		expect(isBrandIconValue('zap')).toBe(false);
		expect(encodeBrandIcon('gcash')).toBe('brand:gcash');
		expect(brandKeyFromIcon('brand:maya')).toBe('maya');
		expect(brandKeyFromIcon('wifi')).toBe(null);
	});
});
