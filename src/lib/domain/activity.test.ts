import { describe, expect, it } from 'vitest';
import {
	ACTIVITY_ACTIONS,
	activityDecideSummary,
	activitySkipSummary,
	activityToggleDoneSummary
} from './activity.ts';

describe('activity summaries', () => {
	it('exposes exactly the six History-feed actions', () => {
		expect([...ACTIVITY_ACTIONS]).toEqual([
			'decide',
			'skip',
			'add',
			'remove',
			'finish',
			'toggle_done'
		]);
	});

	it('formats decide summaries for each decision', () => {
		expect(activityDecideSummary('Rent', 'FULL')).toBe('Chose full for Rent');
		expect(activityDecideSummary('Rent', 'MINIMUM')).toBe('Chose minimum for Rent');
		expect(activityDecideSummary('Rent', 'CUSTOM')).toBe('Chose custom for Rent');
		expect(activityDecideSummary('Rent', 'PENDING')).toBe('Cleared decision for Rent');
		expect(activityDecideSummary('Rent', 'SKIPPED')).toBe('Updated Rent');
	});

	it('formats skip and toggle-done summaries', () => {
		expect(activitySkipSummary('Card', false)).toBe('Skipped Card');
		expect(activitySkipSummary('Card', true)).toBe('Moved Card to next payday');
		expect(activityToggleDoneSummary('Gas', true)).toBe('Marked Gas routed');
		expect(activityToggleDoneSummary('Gas', false)).toBe('Marked Gas not routed');
	});
});
