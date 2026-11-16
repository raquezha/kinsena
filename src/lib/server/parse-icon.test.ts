import { describe, expect, it } from 'vitest';
import { parseStoredIcon } from './parse-icon.ts';

describe('parseStoredIcon', () => {
	it('normalizes auto, category, and brand values', () => {
		expect(parseStoredIcon(null)).toBe(null);
		expect(parseStoredIcon('')).toBe(null);
		expect(parseStoredIcon('  AUTO  ')).toBe(null);
		expect(parseStoredIcon('zap')).toBe('zap');
		expect(parseStoredIcon('brand:bdo')).toBe('brand:bdo');
	});

	it('rejects unknown brand and category keys', () => {
		expect(() => parseStoredIcon('brand:not-a-real-brand-xyz')).toThrow(/Unknown brand/);
		expect(() => parseStoredIcon('notAnIcon')).toThrow(/Unknown category/);
	});
});
