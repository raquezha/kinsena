import type { Decision } from './decision.ts';

/** Six History-feed actions only (no receive/reorder/approve/template archive). */
export const ACTIVITY_ACTIONS = [
	'decide',
	'skip',
	'add',
	'remove',
	'finish',
	'toggle_done'
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export type ActivityEntityType = 'item' | 'payday';

export interface ActivityEvent {
	id: number;
	createdAt: number;
	action: ActivityAction;
	paydayId: number | null;
	entityType: ActivityEntityType;
	entityId: number | null;
	summary: string;
}

export function activityDecideSummary(name: string, decision: Decision): string {
	if (decision === 'FULL') return `Chose full for ${name}`;
	if (decision === 'MINIMUM') return `Chose minimum for ${name}`;
	if (decision === 'CUSTOM') return `Chose custom for ${name}`;
	if (decision === 'PENDING') return `Cleared decision for ${name}`;
	return `Updated ${name}`;
}

export function activitySkipSummary(name: string, moveToNext: boolean): string {
	return moveToNext ? `Moved ${name} to next payday` : `Skipped ${name}`;
}

export function activityToggleDoneSummary(name: string, done: boolean): string {
	return done ? `Marked ${name} routed` : `Marked ${name} not routed`;
}
