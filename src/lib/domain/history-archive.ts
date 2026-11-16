import { hasKnownAmount, type Destination, type RouteItem } from './models.ts';
import type { PaydaySummary } from './summary.ts';

export interface DestinationChip {
	name: string;
	amount: number;
	color: string | null;
}

/** Top destination totals for archive card preview chips. */
export function destinationChips(
	items: RouteItem[],
	destinations: readonly (Destination & { brandIcon?: { color: string } | null })[],
	limit = 2
): { chips: DestinationChip[]; moreCount: number } {
	const totals = new Map<string, DestinationChip>();
	for (const item of items) {
		if (!item.isDone) continue;
		const amount =
			item.chosenAmount > 0 ? item.chosenAmount : hasKnownAmount(item) ? item.fullAmount : 0;
		if (amount <= 0) continue;
		const key = item.destinationId === null ? 'none' : String(item.destinationId);
		const dest =
			item.destinationId === null
				? null
				: (destinations.find((entry) => entry.id === item.destinationId) ?? null);
		const prev = totals.get(key) ?? {
			name: dest?.name ?? 'No destination',
			amount: 0,
			color: dest?.brandIcon?.color ?? null
		};
		prev.amount += amount;
		totals.set(key, prev);
	}
	const sorted = [...totals.values()].sort((a, b) => b.amount - a.amount);
	return {
		chips: sorted.slice(0, limit),
		moreCount: Math.max(0, sorted.length - limit)
	};
}

/** Routed vs planned (or salary) for the archive progress track. */
export function allocationProgress(summary: PaydaySummary): number {
	const denom = summary.plannedFull > 0 ? summary.plannedFull : (summary.salary ?? 0);
	if (denom <= 0) return summary.doneCount > 0 ? 1 : 0;
	return Math.min(1, summary.routed / denom);
}

export function yearFromIsoDate(isoDate: string): string {
	return isoDate.slice(0, 4);
}
