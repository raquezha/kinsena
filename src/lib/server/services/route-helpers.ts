import { activityDecideSummary, activityToggleDoneSummary } from '../../domain/activity.ts';
import { parseAmount } from '../../domain/amount-parser.ts';
import { isRoutedDecision, type Decision } from '../../domain/decision.ts';
import { ensure } from '../../domain/errors.ts';
import { hasKnownAmount, type RouteItem } from '../../domain/models.ts';
import type { Clock, Repositories } from '../ports.ts';
import { requireActiveItem } from './guards.ts';

type Templates = Pick<Repositories, 'templates'>['templates'];
type ToggleDeps = Pick<Repositories, 'paydays' | 'items' | 'templates' | 'activity'> & {
	clock: Clock;
};

export type RemovedItem = Pick<
	RouteItem,
	| 'paydayId'
	| 'destinationId'
	| 'name'
	| 'fullAmountExpr'
	| 'minimumAmount'
	| 'chosenAmount'
	| 'decision'
	| 'decisionReason'
	| 'dueDate'
	| 'isDone'
	| 'sortOrder'
	| 'templateId'
	| 'icon'
>;

export function adjustInstallmentProgress(
	templates: Templates,
	templateId: number | null,
	delta: number
): void {
	if (templateId === null || delta === 0) return;
	const template = templates.findById(templateId);
	if (!template || template.installmentCount === null) return;
	const next = Math.min(
		template.installmentCount,
		Math.max(0, template.installmentsCompleted + delta)
	);
	if (next === template.installmentsCompleted) return;
	templates.update(templateId, { installmentsCompleted: next });
}

export function chosenFor(decision: Decision, item: RouteItem, custom: string | undefined): number {
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

export function toRemoved(item: RouteItem): RemovedItem {
	return {
		paydayId: item.paydayId,
		destinationId: item.destinationId,
		name: item.name,
		fullAmountExpr: item.fullAmountExpr,
		minimumAmount: item.minimumAmount,
		chosenAmount: item.chosenAmount,
		decision: item.decision,
		decisionReason: item.decisionReason,
		dueDate: item.dueDate,
		isDone: item.isDone,
		sortOrder: item.sortOrder,
		templateId: item.templateId,
		icon: item.icon
	};
}

/** Mark routed; unpaid with no decision auto-selects Pay full (quick-pay checkbox). */
export function toggleDoneItem(deps: ToggleDeps, itemId: number): boolean {
	const { paydays, items, templates, activity, clock } = deps;
	const item = requireActiveItem(paydays, items, itemId);
	const nextDone = !item.isDone;
	if (nextDone && !isRoutedDecision(item.decision)) {
		const chosenAmount = chosenFor('FULL', item, undefined);
		items.update(itemId, { decision: 'FULL', chosenAmount, isDone: true });
		activity.add({
			createdAt: clock.now().getTime(),
			action: 'decide',
			paydayId: item.paydayId,
			entityType: 'item',
			entityId: itemId,
			summary: activityDecideSummary(item.name, 'FULL')
		});
	} else {
		items.update(itemId, { isDone: nextDone });
	}
	adjustInstallmentProgress(templates, item.templateId, nextDone ? 1 : -1);
	activity.add({
		createdAt: clock.now().getTime(),
		action: 'toggle_done',
		paydayId: item.paydayId,
		entityType: 'item',
		entityId: itemId,
		summary: activityToggleDoneSummary(item.name, nextDone)
	});
	return nextDone;
}
