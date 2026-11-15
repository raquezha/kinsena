/** How the user is routing this payday toward an item. */
export const DECISIONS = ['PENDING', 'FULL', 'MINIMUM', 'CUSTOM', 'SKIPPED'] as const;

export type Decision = (typeof DECISIONS)[number];

export const DECISION_LABELS: Record<Decision, string> = {
	PENDING: 'Pending',
	FULL: 'Pay full',
	MINIMUM: 'Minimum',
	CUSTOM: 'Custom',
	SKIPPED: 'Skip'
};

export function isDecision(value: string): value is Decision {
	return (DECISIONS as readonly string[]).includes(value);
}

export function isSkipped(decision: Decision): boolean {
	return decision === 'SKIPPED';
}

export function isRoutedDecision(decision: Decision): boolean {
	return decision === 'FULL' || decision === 'MINIMUM' || decision === 'CUSTOM';
}
