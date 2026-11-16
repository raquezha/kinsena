import { describe, expect, it } from 'vitest';
import { formatTemplateUsageLabel } from './destination.ts';

describe('formatTemplateUsageLabel', () => {
	it('labels unused, singular, and plural counts', () => {
		expect(formatTemplateUsageLabel(0)).toBe('Not used yet');
		expect(formatTemplateUsageLabel(1)).toBe('Used in 1 template');
		expect(formatTemplateUsageLabel(2)).toBe('Used in 2 templates');
	});
});
