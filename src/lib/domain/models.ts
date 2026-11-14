import type { Cadence } from './cadence.ts';

/** All money values are integer centavos (1/100 of the major unit). */
export type Cents = number;

export interface TemplateItem {
	id: number;
	name: string;
	/** null means the amount varies each payday. */
	defaultAmount: Cents | null;
	cadence: Cadence;
}

export interface Cycle {
	id: number;
	title: string;
	/** Local date the cycle started, YYYY-MM-DD. */
	date: string;
	salary: Cents | null;
	note: string | null;
	isClosed: boolean;
}

export interface CycleItem {
	id: number;
	cycleId: number;
	name: string;
	amount: Cents;
	/** What the user typed. Blank means the amount is still unknown. */
	amountExpr: string | null;
	isDone: boolean;
	sortOrder: number;
}

export function hasKnownAmount(item: Pick<CycleItem, 'amountExpr'>): boolean {
	return (item.amountExpr ?? '').trim() !== '';
}
