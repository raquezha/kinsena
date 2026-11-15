import { parseAmount, parseOptionalAmount } from '../../domain/amount-parser.ts';
import { isRoutedDecision, type Decision } from '../../domain/decision.ts';
import { ensure } from '../../domain/errors.ts';
import { hasKnownAmount, type RouteItem } from '../../domain/models.ts';
import { ensureMoney, normalizeName, normalizeOptionalDate } from '../../domain/rules.ts';
import type { PaydayService } from './payday-service.ts';
import type { Repositories } from '../ports.ts';
import { requireActiveItem, requireOpenPayday } from './guards.ts';

export interface NewItemInput {
	paydayId: number | null;
	name: string;
	amount: string;
	minimum: string;
	dueDate: string;
	destinationId: number | null;
}

export interface ItemEditInput {
	name: string;
	amount: string;
	minimum: string;
	dueDate: string;
	destinationId: number | null;
}

export type RemovedItem = Pick<
	RouteItem,
	| 'paydayId'
	| 'destinationId'
	| 'name'
	| 'fullAmountExpr'
	| 'minimumAmount'
	| 'chosenAmount'
	| 'decision'
	| 'dueDate'
	| 'isDone'
	| 'sortOrder'
	| 'templateId'
>;

export interface RouteService {
	add(input: NewItemInput): number;
	update(itemId: number, input: ItemEditInput): void;
	decide(itemId: number, decision: Decision, customAmount?: string): void;
	skip(itemId: number, moveToNext: boolean): void;
	toggleDone(itemId: number): boolean;
	assign(itemId: number, paydayId: number | null): void;
	remove(itemId: number): RemovedItem;
	restore(removed: RemovedItem): number;
}

type Deps = Pick<Repositories, 'paydays' | 'items'>;

function chosenFor(decision: Decision, item: RouteItem, custom: string | undefined): number {
	if (decision === 'FULL') {
		ensure(hasKnownAmount(item), 'Set the full amount first');
		return item.fullAmount;
	}
	if (decision === 'MINIMUM') {
		ensure(item.minimumAmount !== null, 'Set a minimum amount first');
		return item.minimumAmount;
	}
	if (decision === 'CUSTOM') {
		const parsed = parseAmount(custom);
		ensure(parsed.expression !== '', 'Enter a custom amount');
		return parsed.cents;
	}
	return 0;
}

export function createRouteService(repos: Deps, paydaysService: PaydayService): RouteService {
	const { paydays, items } = repos;

	const insert = (
		item: Omit<RouteItem, 'id' | 'fullAmount'> & {
			fullAmountExpr: string | null;
			fullAmount?: number;
		}
	) => {
		if (item.paydayId !== null) requireOpenPayday(paydays, item.paydayId);
		const parsed = parseAmount(item.fullAmountExpr ?? '');
		return items.add({
			paydayId: item.paydayId,
			destinationId: item.destinationId,
			name: item.name,
			fullAmount: parsed.cents,
			fullAmountExpr: parsed.expression,
			minimumAmount: item.minimumAmount,
			chosenAmount: item.chosenAmount,
			decision: item.decision,
			dueDate: item.dueDate,
			isDone: item.isDone,
			sortOrder: item.sortOrder,
			templateId: item.templateId
		});
	};

	const service: RouteService = {
		add(input) {
			if (input.paydayId !== null) requireOpenPayday(paydays, input.paydayId);
			const minimum = parseOptionalAmount(input.minimum);
			ensureMoney(minimum, 'minimum');
			return insert({
				paydayId: input.paydayId,
				destinationId: input.destinationId,
				name: normalizeName(input.name),
				fullAmountExpr: input.amount,
				minimumAmount: minimum,
				chosenAmount: 0,
				decision: 'PENDING',
				dueDate: normalizeOptionalDate(input.dueDate, 'due date'),
				isDone: false,
				sortOrder: items.maxSortOrder(input.paydayId) + 1,
				templateId: null
			});
		},
		update(itemId, input) {
			requireActiveItem(paydays, items, itemId);
			const parsed = parseAmount(input.amount);
			const minimum = parseOptionalAmount(input.minimum);
			ensureMoney(minimum, 'minimum');
			const current = items.findById(itemId);
			ensure(current !== null, 'Unknown item');
			const decision = current.decision;
			const chosen =
				decision === 'PENDING' || decision === 'SKIPPED'
					? current.chosenAmount
					: chosenFor(
							decision,
							{ ...current, fullAmount: parsed.cents, minimumAmount: minimum },
							undefined
						);
			items.update(itemId, {
				name: normalizeName(input.name),
				fullAmount: parsed.cents,
				fullAmountExpr: parsed.expression,
				minimumAmount: minimum,
				dueDate: normalizeOptionalDate(input.dueDate, 'due date'),
				destinationId: input.destinationId,
				chosenAmount:
					decision === 'FULL' ? parsed.cents : decision === 'MINIMUM' ? (minimum ?? 0) : chosen
			});
		},
		decide(itemId, decision, customAmount) {
			ensure(decision !== 'SKIPPED', 'Use skip to skip an item');
			const item = requireActiveItem(paydays, items, itemId);
			const chosenAmount = chosenFor(decision, item, customAmount);
			items.update(itemId, {
				decision,
				chosenAmount,
				isDone: decision === 'PENDING' ? false : item.isDone
			});
		},
		skip(itemId, moveToNext) {
			const item = requireActiveItem(paydays, items, itemId);
			if (!moveToNext) {
				items.update(itemId, { decision: 'SKIPPED', chosenAmount: 0, isDone: false });
				return;
			}
			ensure(item.paydayId !== null, 'Assign this item to a payday first');
			const next = paydaysService.nextAfter(item.paydayId);
			items.update(itemId, {
				paydayId: next.id,
				decision: 'PENDING',
				chosenAmount: 0,
				isDone: false
			});
		},
		toggleDone(itemId) {
			const item = requireActiveItem(paydays, items, itemId);
			if (!item.isDone) {
				ensure(isRoutedDecision(item.decision), 'Choose how to route this item first');
			}
			items.update(itemId, { isDone: !item.isDone });
			return !item.isDone;
		},
		assign(itemId, paydayId) {
			requireActiveItem(paydays, items, itemId);
			if (paydayId !== null) requireOpenPayday(paydays, paydayId);
			items.update(itemId, { paydayId });
		},
		remove(itemId) {
			const item = requireActiveItem(paydays, items, itemId);
			items.remove(itemId);
			const {
				paydayId,
				destinationId,
				name,
				fullAmountExpr,
				minimumAmount,
				chosenAmount,
				decision,
				dueDate,
				isDone,
				sortOrder,
				templateId
			} = item;
			return {
				paydayId,
				destinationId,
				name,
				fullAmountExpr,
				minimumAmount,
				chosenAmount,
				decision,
				dueDate,
				isDone,
				sortOrder,
				templateId
			};
		},
		restore(removed) {
			return insert({
				...removed,
				fullAmountExpr: removed.fullAmountExpr
			});
		}
	};
	return service;
}
