import { and, asc, eq, isNull, max } from 'drizzle-orm';
import type { RouteItem } from '../../../domain/models.ts';
import type { RouteItemRepository } from '../../ports.ts';
import type { Db } from '../database.ts';
import { routeItems } from '../schema.ts';

const columns = {
	id: routeItems.id,
	paydayId: routeItems.paydayId,
	destinationId: routeItems.destinationId,
	name: routeItems.name,
	fullAmount: routeItems.fullAmount,
	fullAmountExpr: routeItems.fullAmountExpr,
	minimumAmount: routeItems.minimumAmount,
	chosenAmount: routeItems.chosenAmount,
	decision: routeItems.decision,
	dueDate: routeItems.dueDate,
	isDone: routeItems.isDone,
	sortOrder: routeItems.sortOrder,
	templateId: routeItems.templateId
};

export function createRouteItemRepository(db: Db): RouteItemRepository {
	const order = [asc(routeItems.sortOrder), asc(routeItems.id)] as const;

	return {
		findById(id): RouteItem | null {
			return db.select(columns).from(routeItems).where(eq(routeItems.id, id)).get() ?? null;
		},
		listByPayday(paydayId) {
			return db
				.select(columns)
				.from(routeItems)
				.where(eq(routeItems.paydayId, paydayId))
				.orderBy(...order)
				.all();
		},
		listInbox() {
			return db
				.select(columns)
				.from(routeItems)
				.where(isNull(routeItems.paydayId))
				.orderBy(...order)
				.all();
		},
		add(item) {
			return db.insert(routeItems).values(item).returning({ id: routeItems.id }).get().id;
		},
		update(id, patch) {
			if (Object.keys(patch).length === 0) return false;
			return db.update(routeItems).set(patch).where(eq(routeItems.id, id)).run().changes === 1;
		},
		remove(id) {
			return db.delete(routeItems).where(eq(routeItems.id, id)).run().changes === 1;
		},
		maxSortOrder(paydayId) {
			const filter =
				paydayId === null ? isNull(routeItems.paydayId) : eq(routeItems.paydayId, paydayId);
			const row = db
				.select({ value: max(routeItems.sortOrder) })
				.from(routeItems)
				.where(filter)
				.get();
			return row?.value ?? -1;
		},
		hasTemplate(paydayId, templateId) {
			const row = db
				.select({ id: routeItems.id })
				.from(routeItems)
				.where(and(eq(routeItems.paydayId, paydayId), eq(routeItems.templateId, templateId)))
				.get();
			return row !== undefined;
		}
	};
}
