import { isSkipped } from './decision.ts';
import { ensure } from './errors.ts';
import type { RouteItem } from './models.ts';
import { sortForChecklist } from './summary.ts';

/** Open = not done and not skipped. Only these participate in checklist reorder. */
export function isChecklistOpen(item: Pick<RouteItem, 'isDone' | 'decision'>): boolean {
	return !item.isDone && !isSkipped(item.decision);
}

export function openItemIds(
	items: readonly Pick<RouteItem, 'id' | 'isDone' | 'decision'>[]
): number[] {
	return items.filter(isChecklistOpen).map((item) => item.id);
}

/**
 * Validate a full open-item id sequence and return contiguous sortOrder values.
 * Rejects stale lists, duplicates, missing ids, and done/skipped ids.
 */
export function sortOrdersForOpenReorder(
	currentOpenIds: readonly number[],
	orderedOpenIds: readonly number[]
): Map<number, number> {
	ensure(
		orderedOpenIds.length === currentOpenIds.length &&
			new Set(orderedOpenIds).size === orderedOpenIds.length,
		'Checklist order is out of date — refresh and try again'
	);
	const open = new Set(currentOpenIds);
	for (const id of orderedOpenIds) {
		ensure(open.has(id), 'Only open items can be reordered');
	}
	return new Map(orderedOpenIds.map((id, index) => [id, index]));
}

/** Apply open reorder to items; done/skipped keep their sortOrder until next open rewrite. */
export function withOpenReorder(
	items: readonly RouteItem[],
	orderedOpenIds: readonly number[]
): RouteItem[] {
	const orders = sortOrdersForOpenReorder(openItemIds(items), orderedOpenIds);
	return items.map((item) => {
		const sortOrder = orders.get(item.id);
		return sortOrder === undefined ? item : { ...item, sortOrder };
	});
}

/**
 * Parity helper: after an open reorder, checklist open order must equal orderedOpenIds.
 * Done stay after open; skipped stay last.
 */
export function checklistOpenOrderAfter(
	items: readonly RouteItem[],
	orderedOpenIds: readonly number[]
): number[] {
	return openItemIds(sortForChecklist(withOpenReorder(items, orderedOpenIds)));
}
