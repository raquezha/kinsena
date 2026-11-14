import { and, asc, eq } from 'drizzle-orm';
import type { TemplateItem } from '../../../domain/models.ts';
import type { NewTemplate, TemplateRepository } from '../../ports.ts';
import type { Db } from '../database.ts';
import { templateItems } from '../schema.ts';

const columns = {
	id: templateItems.id,
	name: templateItems.name,
	defaultAmount: templateItems.defaultAmount,
	cadence: templateItems.cadence
};

export function createTemplateRepository(db: Db): TemplateRepository {
	const activeById = (id: number) =>
		and(eq(templateItems.id, id), eq(templateItems.isArchived, false));

	return {
		listActive(): TemplateItem[] {
			return db
				.select(columns)
				.from(templateItems)
				.where(eq(templateItems.isArchived, false))
				.orderBy(asc(templateItems.name), asc(templateItems.id))
				.all();
		},
		add(template: NewTemplate): number {
			return db.insert(templateItems).values(template).returning({ id: templateItems.id }).get().id;
		},
		updateAmount(id, amount) {
			const result = db
				.update(templateItems)
				.set({ defaultAmount: amount })
				.where(activeById(id))
				.run();
			return result.changes === 1;
		},
		archive(id) {
			const result = db.update(templateItems).set({ isArchived: true }).where(activeById(id)).run();
			return result.changes === 1;
		}
	};
}
