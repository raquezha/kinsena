/** When a saved item is due: around the 15th, at month end, or every payday. */
export const CADENCES = ['ANY', 'MID_MONTH', 'MONTH_END'] as const;

export type Cadence = (typeof CADENCES)[number];

export const CADENCE_LABELS: Record<Cadence, string> = {
	ANY: 'Every payday',
	MID_MONTH: 'Mid-month',
	MONTH_END: 'Month end'
};

export function isCadence(value: string): value is Cadence {
	return (CADENCES as readonly string[]).includes(value);
}

/** A saved item joins a cycle when either side is ANY or both cadences match. */
export function cadenceMatches(itemCadence: Cadence, cycleCadence: Cadence): boolean {
	return itemCadence === 'ANY' || cycleCadence === 'ANY' || itemCadence === cycleCadence;
}
