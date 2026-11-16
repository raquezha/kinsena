import { describe, expect, it } from 'vitest';
import { getRecurringIcon } from './recurring-icon.ts';

describe('getRecurringIcon', () => {
	it('matches generic category keywords without brand hardcoding', () => {
		expect(getRecurringIcon('Home internet fiber')).toBe('wifi');
		expect(getRecurringIcon('Electric bill')).toBe('zap');
		expect(getRecurringIcon('HOA dues')).toBe('home');
		expect(getRecurringIcon('Emergency stash')).toBe('piggyBank');
	});

	it('falls back to destination kind, then repeat', () => {
		expect(getRecurringIcon('Misc', 'ACCOUNT')).toBe('landmark');
		expect(getRecurringIcon('Misc', 'BILLER')).toBe('receipt');
		expect(getRecurringIcon('Misc')).toBe('repeat');
	});
});
