import type { PaydayCadence } from './cadence.ts';
import type { Decision } from './decision.ts';
import type { DestinationKind } from './destination.ts';
import type { FundFrom } from './fund-from.ts';

/** All money values are integer centavos (1/100 of the major unit). */
export type Cents = number;

export interface Destination {
	id: number;
	name: string;
	kind: DestinationKind;
}

export interface TemplateItem {
	id: number;
	name: string;
	/** null means the amount varies each payday. */
	defaultAmount: Cents | null;
	minimumAmount: Cents | null;
	dueDay: number | null;
	fundFrom: FundFrom;
	destinationId: number | null;
	/** null = not an installment plan. */
	installmentCount: number | null;
	/** Paid installments toward installmentCount. */
	installmentsCompleted: number;
}

export interface Payday {
	id: number;
	title: string;
	cadence: PaydayCadence;
	/** Scheduled pay day (15th or 30th by default). YYYY-MM-DD. */
	scheduledDate: string;
	/** When the money is expected to arrive. YYYY-MM-DD. */
	payDate: string;
	expectedAmount: Cents | null;
	receivedAmount: Cents | null;
	/** Set when the user marks salary as in. YYYY-MM-DD. */
	receivedAt: string | null;
	note: string | null;
	isClosed: boolean;
}

export interface RouteItem {
	id: number;
	/** null means the item is still in the inbox. */
	paydayId: number | null;
	destinationId: number | null;
	name: string;
	fullAmount: Cents;
	/** What the user typed for the full amount. Blank means unknown. */
	fullAmountExpr: string | null;
	minimumAmount: Cents | null;
	chosenAmount: Cents;
	decision: Decision;
	/** Why the current decision was suggested or chosen, if known. */
	decisionReason: string | null;
	dueDate: string | null;
	isDone: boolean;
	sortOrder: number;
	templateId: number | null;
}

export function hasKnownAmount(item: Pick<RouteItem, 'fullAmountExpr'>): boolean {
	return (item.fullAmountExpr ?? '').trim() !== '';
}

export function isReceived(payday: Pick<Payday, 'receivedAt'>): boolean {
	return payday.receivedAt !== null;
}

export interface Holiday {
	id: number;
	date: string;
	name: string;
	kind: import('./pay-rule.ts').HolidayKind;
}

export interface Settings {
	currency: import('./currency.ts').CurrencyCode;
	midMonthSalary: Cents | null;
	monthEndSalary: Cents | null;
	payRule: import('./pay-rule.ts').PayRule;
}
