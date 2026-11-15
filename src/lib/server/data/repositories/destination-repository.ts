import { and, asc, eq } from 'drizzle-orm';
import type { Destination } from '../../../domain/models.ts';
import type { DestinationRepository } from '../../ports.ts';
import type { Db } from '../database.ts';
import { destinations } from '../schema.ts';

const columns = {
	id: destinations.id,
	name: destinations.name,
	kind: destinations.kind
};

export function createDestinationRepository(db: Db): DestinationRepository {
	const activeById = (id: number) =>
		and(eq(destinations.id, id), eq(destinations.isArchived, false));

	return {
		listActive(): Destination[] {
			return db
				.select(columns)
				.from(destinations)
				.where(eq(destinations.isArchived, false))
				.orderBy(asc(destinations.name), asc(destinations.id))
				.all();
		},
		findById(id) {
			return db.select(columns).from(destinations).where(eq(destinations.id, id)).get() ?? null;
		},
		add(destination) {
			return db.insert(destinations).values(destination).returning({ id: destinations.id }).get()
				.id;
		},
		update(id, patch) {
			if (Object.keys(patch).length === 0) return false;
			return db.update(destinations).set(patch).where(activeById(id)).run().changes === 1;
		},
		archive(id) {
			return (
				db.update(destinations).set({ isArchived: true }).where(activeById(id)).run().changes === 1
			);
		}
	};
}
