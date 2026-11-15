import type { PaydayCadence } from '../domain/cadence.ts';
import type { CurrencyCode } from '../domain/currency.ts';
import type { DestinationKind } from '../domain/destination.ts';
import type { FundFrom } from '../domain/fund-from.ts';
import type {
	Cents,
	Destination,
	Payday,
	RouteItem,
	Settings,
	TemplateItem
} from '../domain/models.ts';

export interface NewTemplate {
	name: string;
	defaultAmount: Cents | null;
	minimumAmount: Cents | null;
	dueDay: number | null;
	fundFrom: FundFrom;
	destinationId: number | null;
	createdAt: number;
}

export type TemplatePatch = Partial<
	Pick<
		TemplateItem,
		'name' | 'defaultAmount' | 'minimumAmount' | 'dueDay' | 'fundFrom' | 'destinationId'
	>
>;

export interface TemplateRepository {
	listActive(): TemplateItem[];
	findById(id: number): TemplateItem | null;
	add(template: NewTemplate): number;
	update(id: number, patch: TemplatePatch): boolean;
	archive(id: number): boolean;
}

export type NewPayday = Omit<Payday, 'id' | 'isClosed'> & { createdAt: number };
export type PaydayPatch = Partial<
	Pick<
		Payday,
		'title' | 'payDate' | 'expectedAmount' | 'receivedAmount' | 'receivedAt' | 'note' | 'isClosed'
	>
>;

export interface PaydayRepository {
	findById(id: number): Payday | null;
	findByScheduledDate(scheduledDate: string): Payday | null;
	/** Open paydays, soonest scheduled date first. */
	listOpen(): Payday[];
	/** Closed paydays, newest scheduled date first. */
	listClosed(): Payday[];
	findLatest(): Payday | null;
	create(payday: NewPayday): number;
	update(id: number, patch: PaydayPatch): boolean;
}

export type NewRouteItem = Omit<RouteItem, 'id'>;
export type RouteItemPatch = Partial<
	Pick<
		RouteItem,
		| 'paydayId'
		| 'destinationId'
		| 'name'
		| 'fullAmount'
		| 'fullAmountExpr'
		| 'minimumAmount'
		| 'chosenAmount'
		| 'decision'
		| 'decisionReason'
		| 'dueDate'
		| 'isDone'
		| 'sortOrder'
		| 'templateId'
	>
>;

export interface RouteItemRepository {
	findById(id: number): RouteItem | null;
	listByPayday(paydayId: number): RouteItem[];
	listInbox(): RouteItem[];
	add(item: NewRouteItem): number;
	update(id: number, patch: RouteItemPatch): boolean;
	remove(id: number): boolean;
	maxSortOrder(paydayId: number | null): number;
	hasTemplate(paydayId: number, templateId: number): boolean;
}

export interface NewDestination {
	name: string;
	kind: DestinationKind;
	createdAt: number;
}

export interface DestinationRepository {
	listActive(): Destination[];
	findById(id: number): Destination | null;
	add(destination: NewDestination): number;
	update(id: number, patch: Partial<Pick<Destination, 'name' | 'kind'>>): boolean;
	archive(id: number): boolean;
}

export interface SettingsRepository {
	get(): Settings;
	setCurrency(currency: CurrencyCode): void;
	setSalaries(midMonth: Cents | null, monthEnd: Cents | null): void;
}

export interface Repositories {
	templates: TemplateRepository;
	paydays: PaydayRepository;
	items: RouteItemRepository;
	destinations: DestinationRepository;
	settings: SettingsRepository;
}

export interface Clock {
	now(): Date;
}

export type { PaydayCadence, Cents };
