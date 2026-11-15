import type { RouteItem } from '../domain/models.ts';
import { sortForChecklist } from '../domain/summary.ts';

/** Changes shown before the server confirms them. */
export interface PendingChanges {
	/** item id -> done state the user just chose */
	paid: ReadonlyMap<number, boolean>;
	/** items the user just deleted */
	hidden: ReadonlySet<number>;
}

export const NO_CHANGES: PendingChanges = { paid: new Map(), hidden: new Set() };

/** Server items with the user's unconfirmed changes applied, in checklist order. */
export function withPending(items: RouteItem[], pending: PendingChanges): RouteItem[] {
	const visible = items
		.filter((item) => !pending.hidden.has(item.id))
		.map((item) => {
			const paid = pending.paid.get(item.id);
			return paid === undefined ? item : { ...item, isDone: paid };
		});
	return sortForChecklist(visible);
}

export function setPaid(pending: PendingChanges, id: number, paid: boolean): PendingChanges {
	return { ...pending, paid: new Map(pending.paid).set(id, paid) };
}

export function hide(pending: PendingChanges, id: number): PendingChanges {
	return { ...pending, hidden: new Set(pending.hidden).add(id) };
}

/** Forgets the change for an item once the server confirmed or rejected it. */
export function settle(pending: PendingChanges, id: number): PendingChanges {
	const paid = new Map(pending.paid);
	const hidden = new Set(pending.hidden);
	paid.delete(id);
	hidden.delete(id);
	return { paid, hidden };
}
