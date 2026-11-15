import { dueDateForPayday, templateFitsPayday } from '../../domain/fund-from.ts';
import { isReceived, type TemplateItem } from '../../domain/models.ts';
import { formatEdit } from '../../domain/money.ts';
import type { NewRouteItem, Repositories } from '../ports.ts';

export function itemFromTemplate(
	template: TemplateItem,
	paydayId: number,
	dueDate: string | null,
	sortOrder: number
): NewRouteItem {
	const amount = template.defaultAmount;
	return {
		paydayId,
		destinationId: template.destinationId,
		name: template.name,
		fullAmount: amount ?? 0,
		fullAmountExpr: amount === null ? '' : formatEdit(amount),
		minimumAmount: template.minimumAmount,
		chosenAmount: 0,
		decision: 'PENDING',
		decisionReason: null,
		dueDate,
		isDone: false,
		sortOrder,
		templateId: template.id
	};
}

export function applyTemplateToUpcoming(
	repos: Pick<Repositories, 'paydays' | 'items'>,
	template: TemplateItem
): void {
	for (const payday of repos.paydays.listOpen()) {
		if (isReceived(payday) || payday.isClosed) continue;
		if (repos.items.hasTemplate(payday.id, template.id)) continue;
		if (!templateFitsPayday(template, payday)) continue;
		const dueDate = dueDateForPayday(template, payday);
		const sortOrder = repos.items.maxSortOrder(payday.id) + 1;
		repos.items.add(itemFromTemplate(template, payday.id, dueDate, sortOrder));
	}
}
