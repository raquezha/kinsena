import { desc, eq } from 'drizzle-orm';
import type { Cycle } from '../../../domain/models.ts';
import type { CycleRepository } from '../../ports.ts';
import type { Db } from '../database.ts';
import { cycleItems, cycles } from '../schema.ts';

const columns = {
	id: cycles.id,
	title: cycles.title,
	date: cycles.date,
	salary: cycles.salary,
	note: cycles.note,
	isClosed: cycles.isClosed
};

export function createCycleRepository(db: Db): CycleRepository {
	const newestFirst = desc(cycles.id);
	const first = (rows: Cycle[]) => rows[0] ?? null;

	return {
		findOpen: () =>
			first(
				db
					.select(columns)
					.from(cycles)
					.where(eq(cycles.isClosed, false))
					.orderBy(newestFirst)
					.limit(1)
					.all()
			),
		findLatest: () => first(db.select(columns).from(cycles).orderBy(newestFirst).limit(1).all()),
		findById: (id) => first(db.select(columns).from(cycles).where(eq(cycles.id, id)).all()),
		listClosed: () =>
			db.select(columns).from(cycles).where(eq(cycles.isClosed, true)).orderBy(newestFirst).all(),
		create(cycle, items) {
			return db.transaction((tx) => {
				const { id } = tx.insert(cycles).values(cycle).returning({ id: cycles.id }).get();
				if (items.length > 0) {
					tx.insert(cycleItems)
						.values(items.map((item) => ({ ...item, cycleId: id })))
						.run();
				}
				return id;
			});
		},
		update(id, patch) {
			if (Object.keys(patch).length === 0) return false;
			return db.update(cycles).set(patch).where(eq(cycles.id, id)).run().changes === 1;
		}
	};
}
