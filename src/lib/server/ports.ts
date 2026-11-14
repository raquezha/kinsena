import type { Cadence } from '../domain/cadence.ts';
import type { CurrencyCode } from '../domain/currency.ts';
import type { Cents, Cycle, CycleItem, TemplateItem } from '../domain/models.ts';

export interface NewTemplate {
	name: string;
	defaultAmount: Cents | null;
	cadence: Cadence;
	createdAt: number;
}

export interface TemplateRepository {
	/** Saved items that are not archived, by name. */
	listActive(): TemplateItem[];
	add(template: NewTemplate): number;
	/** Returns false when the item is unknown or archived. */
	updateAmount(id: number, amount: Cents | null): boolean;
	archive(id: number): boolean;
}

export type NewCycle = Omit<Cycle, 'id' | 'isClosed'> & { createdAt: number };
export type CyclePatch = Partial<Pick<Cycle, 'salary' | 'note' | 'isClosed'>>;

export interface CycleRepository {
	findOpen(): Cycle | null;
	findLatest(): Cycle | null;
	findById(id: number): Cycle | null;
	/** Finished cycles, newest first. */
	listClosed(): Cycle[];
	/** Creates the cycle and its items in one transaction. */
	create(cycle: NewCycle, items: NewCycleItem[]): number;
	update(id: number, patch: CyclePatch): boolean;
}

export type NewCycleItem = Omit<CycleItem, 'id' | 'cycleId'>;
export type ItemPatch = Partial<Pick<CycleItem, 'amount' | 'amountExpr' | 'isDone'>>;

export interface ItemRepository {
	findById(id: number): CycleItem | null;
	listByCycle(cycleId: number): CycleItem[];
	add(cycleId: number, item: NewCycleItem): number;
	update(id: number, patch: ItemPatch): boolean;
	remove(id: number): boolean;
	removeByCycle(cycleId: number): number;
	/** Highest sort order in the cycle, or -1 when it has no items. */
	maxSortOrder(cycleId: number): number;
}

export interface SettingsRepository {
	getCurrency(): CurrencyCode;
	setCurrency(currency: CurrencyCode): void;
}

export interface Repositories {
	templates: TemplateRepository;
	cycles: CycleRepository;
	items: ItemRepository;
	settings: SettingsRepository;
}

export interface Clock {
	now(): Date;
}
