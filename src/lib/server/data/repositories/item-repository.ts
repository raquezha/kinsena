import { asc, eq, max } from 'drizzle-orm';
import type { CycleItem } from '../../../domain/models.ts';
import type { ItemRepository } from '../../ports.ts';
import type { Db } from '../database.ts';
import { cycleItems } from '../schema.ts';

const columns = {
	id: cycleItems.id,
	cycleId: cycleItems.cycleId,
	name: cycleItems.name,
	amount: cycleItems.amount,
	amountExpr: cycleItems.amountExpr,
	isDone: cycleItems.isDone,
	sortOrder: cycleItems.sortOrder
};

export function createItemRepository(db: Db): ItemRepository {
	return {
		findById(id): CycleItem | null {
			return db.select(columns).from(cycleItems).where(eq(cycleItems.id, id)).get() ?? null;
		},
		listByCycle(cycleId) {
			return db
				.select(columns)
				.from(cycleItems)
				.where(eq(cycleItems.cycleId, cycleId))
				.orderBy(asc(cycleItems.sortOrder), asc(cycleItems.id))
				.all();
		},
		add(cycleId, item) {
			return db
				.insert(cycleItems)
				.values({ ...item, cycleId })
				.returning({ id: cycleItems.id })
				.get().id;
		},
		update(id, patch) {
			if (Object.keys(patch).length === 0) return false;
			return db.update(cycleItems).set(patch).where(eq(cycleItems.id, id)).run().changes === 1;
		},
		remove(id) {
			return db.delete(cycleItems).where(eq(cycleItems.id, id)).run().changes === 1;
		},
		removeByCycle(cycleId) {
			return db.delete(cycleItems).where(eq(cycleItems.cycleId, cycleId)).run().changes;
		},
		maxSortOrder(cycleId) {
			const row = db
				.select({ value: max(cycleItems.sortOrder) })
				.from(cycleItems)
				.where(eq(cycleItems.cycleId, cycleId))
				.get();
			return row?.value ?? -1;
		}
	};
}
