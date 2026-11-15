import { dueDateForPayday, templateFitsPayday } from '../../domain/fund-from.ts';
import { isReceived, type Payday, type TemplateItem } from '../../domain/models.ts';
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

export interface ApplyMissingResult {
	added: number;
	alreadyPresent: number;
	skippedByRule: number;
}

/** Copy active defaults onto one payday when missing. Skips received/closed and non-fitting rules. */
export function applyMissingDefaultsToPayday(
	repos: Pick<Repositories, 'items' | 'templates'>,
	payday: Payday
): ApplyMissingResult {
	let added = 0;
	let alreadyPresent = 0;
	let skippedByRule = 0;
	const locked = isReceived(payday) || payday.isClosed;
	let order = repos.items.maxSortOrder(payday.id);
	for (const template of repos.templates.listActive()) {
		if (repos.items.hasTemplate(payday.id, template.id)) {
			alreadyPresent += 1;
			continue;
		}
		if (locked || !templateFitsPayday(template, payday)) {
			skippedByRule += 1;
			continue;
		}
		const dueDate = dueDateForPayday(template, payday);
		repos.items.add(itemFromTemplate(template, payday.id, dueDate, ++order));
		added += 1;
	}
	return { added, alreadyPresent, skippedByRule };
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
