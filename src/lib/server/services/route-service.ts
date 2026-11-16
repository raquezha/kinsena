import { activityDecideSummary, activitySkipSummary } from '../../domain/activity.ts';
import { parseAmount, parseOptionalAmount } from '../../domain/amount-parser.ts';
import type { Decision } from '../../domain/decision.ts';
import { ensure } from '../../domain/errors.ts';
import type { RouteItem } from '../../domain/models.ts';
import { openItemIds, sortOrdersForOpenReorder } from '../../domain/reorder.ts';
import { ensureMoney, normalizeName, normalizeOptionalDate } from '../../domain/rules.ts';
import { parseStoredIcon } from '../parse-icon.ts';
import type { Clock, Repositories } from '../ports.ts';
import type { PaydayService } from './payday-service.ts';
import { requireActiveItem, requireOpenPayday } from './guards.ts';
import {
	adjustInstallmentProgress,
	chosenFor,
	toggleDoneItem,
	toRemoved,
	type RemovedItem
} from './route-helpers.ts';

export type { RemovedItem };

export interface NewItemInput {
	paydayId: number | null;
	name: string;
	amount: string;
	minimum: string;
	dueDate: string;
	destinationId: number | null;
	icon?: string | null;
}

export interface ItemEditInput {
	name: string;
	amount: string;
	minimum: string;
	dueDate: string;
	destinationId: number | null;
	icon?: string | null;
}

export interface RouteService {
	add(input: NewItemInput): number;
	update(itemId: number, input: ItemEditInput): void;
	decide(itemId: number, decision: Decision, customAmount?: string): void;
	skip(itemId: number, moveToNext: boolean): void;
	toggleDone(itemId: number): boolean;
	assign(itemId: number, paydayId: number | null): void;
	/** Rewrite sortOrder for open (not done / not skipped) items only. */
	reorder(paydayId: number, orderedOpenIds: number[]): void;
	remove(itemId: number): RemovedItem;
	restore(removed: RemovedItem): number;
}

type Deps = Pick<Repositories, 'paydays' | 'items' | 'templates' | 'activity' | 'transaction'>;

export function createRouteService(
	repos: Deps,
	paydaysService: PaydayService,
	clock: Clock
): RouteService {
	const { paydays, items, templates, activity, transaction } = repos;

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
			decisionReason: item.decisionReason ?? null,
			dueDate: item.dueDate,
			isDone: item.isDone,
			sortOrder: item.sortOrder,
			templateId: item.templateId,
			icon: item.icon ?? null
		});
	};

	const service: RouteService = {
		add(input) {
			return transaction(() => {
				if (input.paydayId !== null) requireOpenPayday(paydays, input.paydayId);
				const minimum = parseOptionalAmount(input.minimum);
				ensureMoney(minimum, 'minimum');
				const name = normalizeName(input.name);
				const id = insert({
					paydayId: input.paydayId,
					destinationId: input.destinationId,
					name,
					fullAmountExpr: input.amount,
					minimumAmount: minimum,
					chosenAmount: 0,
					decision: 'PENDING',
					decisionReason: null,
					dueDate: normalizeOptionalDate(input.dueDate, 'due date'),
					isDone: false,
					sortOrder: items.maxSortOrder(input.paydayId) + 1,
					templateId: null,
					icon: parseStoredIcon(input.icon)
				});
				activity.add({
					createdAt: clock.now().getTime(),
					action: 'add',
					paydayId: input.paydayId,
					entityType: 'item',
					entityId: id,
					summary: `Added ${name}`
				});
				return id;
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
				icon: parseStoredIcon(input.icon),
				chosenAmount:
					decision === 'FULL' ? parsed.cents : decision === 'MINIMUM' ? (minimum ?? 0) : chosen
			});
		},
		decide(itemId, decision, customAmount) {
			transaction(() => {
				ensure(decision !== 'SKIPPED', 'Use skip to skip an item');
				const item = requireActiveItem(paydays, items, itemId);
				const chosenAmount = chosenFor(decision, item, customAmount);
				items.update(itemId, {
					decision,
					chosenAmount,
					isDone: decision === 'PENDING' ? false : item.isDone
				});
				activity.add({
					createdAt: clock.now().getTime(),
					action: 'decide',
					paydayId: item.paydayId,
					entityType: 'item',
					entityId: itemId,
					summary: activityDecideSummary(item.name, decision)
				});
			});
		},
		skip(itemId, moveToNext) {
			transaction(() => {
				const item = requireActiveItem(paydays, items, itemId);
				if (!moveToNext) {
					items.update(itemId, {
						decision: 'SKIPPED',
						chosenAmount: 0,
						decisionReason: null,
						isDone: false
					});
				} else {
					ensure(item.paydayId !== null, 'Assign this item to a payday first');
					const next = paydaysService.nextAfter(item.paydayId);
					items.update(itemId, {
						paydayId: next.id,
						decision: 'PENDING',
						chosenAmount: 0,
						isDone: false
					});
				}
				activity.add({
					createdAt: clock.now().getTime(),
					action: 'skip',
					paydayId: item.paydayId,
					entityType: 'item',
					entityId: itemId,
					summary: activitySkipSummary(item.name, moveToNext)
				});
			});
		},
		toggleDone(itemId) {
			return transaction(() =>
				toggleDoneItem({ paydays, items, templates, activity, clock }, itemId)
			);
		},
		assign(itemId, paydayId) {
			requireActiveItem(paydays, items, itemId);
			if (paydayId !== null) requireOpenPayday(paydays, paydayId);
			items.update(itemId, { paydayId });
		},
		reorder(paydayId, orderedOpenIds) {
			requireOpenPayday(paydays, paydayId);
			const orders = sortOrdersForOpenReorder(
				openItemIds(items.listByPayday(paydayId)),
				orderedOpenIds
			);
			for (const [id, sortOrder] of orders) items.update(id, { sortOrder });
		},
		remove(itemId) {
			return transaction(() => {
				const item = requireActiveItem(paydays, items, itemId);
				if (item.isDone) adjustInstallmentProgress(templates, item.templateId, -1);
				items.remove(itemId);
				activity.add({
					createdAt: clock.now().getTime(),
					action: 'remove',
					paydayId: item.paydayId,
					entityType: 'item',
					entityId: itemId,
					summary: `Removed ${item.name}`
				});
				return toRemoved(item);
			});
		},
		restore(removed) {
			return insert({ ...removed, icon: removed.icon ?? null });
		}
	};
	return service;
}
