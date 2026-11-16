import type { RouteItem } from '../domain/models.ts';
import { sortForChecklist } from '../domain/summary.ts';

/** Changes shown before the server confirms them. */
export interface PendingChanges {
	/** item id -> done state the user just chose */
	paid: ReadonlyMap<number, boolean>;
	/** items the user just deleted */
	hidden: ReadonlySet<number>;
	/** open-item id -> sortOrder from a drag that already saved (avoids refresh flicker) */
	order: ReadonlyMap<number, number> | null;
}

export const NO_CHANGES: PendingChanges = { paid: new Map(), hidden: new Set(), order: null };

/** Server items with the user's unconfirmed changes applied, in checklist order. */
export function withPending(items: RouteItem[], pending: PendingChanges): RouteItem[] {
	const visible = items
		.filter((item) => !pending.hidden.has(item.id))
		.map((item) => {
			const paid = pending.paid.get(item.id);
			const sortOrder = pending.order?.get(item.id);
			let next = item;
			if (paid !== undefined) next = { ...next, isDone: paid };
			if (sortOrder !== undefined) next = { ...next, sortOrder };
			return next;
		});
	return sortForChecklist(visible);
}

export function setPaid(pending: PendingChanges, id: number, paid: boolean): PendingChanges {
	return { ...pending, paid: new Map(pending.paid).set(id, paid) };
}

export function hide(pending: PendingChanges, id: number): PendingChanges {
	const hidden = new Set(pending.hidden).add(id);
	if (!pending.order?.has(id)) return { ...pending, hidden };
	const order = new Map(pending.order);
	order.delete(id);
	return { ...pending, hidden, order: order.size > 0 ? order : null };
}

/** Contiguous ranks for the open checklist after a successful drag. */
export function setOrder(pending: PendingChanges, orderedOpenIds: readonly number[]): PendingChanges {
	return {
		...pending,
		order: new Map(orderedOpenIds.map((id, index) => [id, index]))
	};
}

/** Drop client order overlay after a full server refresh. */
export function clearOrder(pending: PendingChanges): PendingChanges {
	return pending.order === null ? pending : { ...pending, order: null };
}

/** Forgets the change for an item once the server confirmed or rejected it. */
export function settle(pending: PendingChanges, id: number): PendingChanges {
	const paid = new Map(pending.paid);
	const hidden = new Set(pending.hidden);
	paid.delete(id);
	hidden.delete(id);
	return { ...pending, paid, hidden };
}
