/** The kind of payday: around the 15th, at month end, or a one-off. */
export const PAYDAY_CADENCES = ['MID_MONTH', 'MONTH_END', 'OTHER'] as const;

export type PaydayCadence = (typeof PAYDAY_CADENCES)[number];

export const PAYDAY_CADENCE_LABELS: Record<PaydayCadence, string> = {
	MID_MONTH: 'Mid-month',
	MONTH_END: 'Month end',
	OTHER: 'Other'
};

export function isPaydayCadence(value: string): value is PaydayCadence {
	return (PAYDAY_CADENCES as readonly string[]).includes(value);
}

export const SCHEDULED_CADENCES = ['MID_MONTH', 'MONTH_END'] as const;

export type ScheduledCadence = (typeof SCHEDULED_CADENCES)[number];

export function isScheduledCadence(value: string): value is ScheduledCadence {
	return (SCHEDULED_CADENCES as readonly string[]).includes(value);
}
