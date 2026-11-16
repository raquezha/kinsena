import { and, asc, eq } from 'drizzle-orm';
import type { TemplateItem } from '../../../domain/models.ts';
import type { NewTemplate, TemplateRepository } from '../../ports.ts';
import type { Db } from '../database.ts';
import { templateItems } from '../schema.ts';

const columns = {
	id: templateItems.id,
	name: templateItems.name,
	defaultAmount: templateItems.defaultAmount,
	minimumAmount: templateItems.minimumAmount,
	dueDay: templateItems.dueDay,
	fundFrom: templateItems.fundFrom,
	destinationId: templateItems.destinationId,
	installmentCount: templateItems.installmentCount,
	installmentsCompleted: templateItems.installmentsCompleted,
	isActive: templateItems.isActive
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
		findById(id) {
			const row = db.select(columns).from(templateItems).where(activeById(id)).get();
			return row ?? null;
		},
		add(template: NewTemplate): number {
			return db.insert(templateItems).values(template).returning({ id: templateItems.id }).get().id;
		},
		update(id, patch) {
			if (Object.keys(patch).length === 0) return false;
			return db.update(templateItems).set(patch).where(activeById(id)).run().changes === 1;
		},
		archive(id) {
			return (
				db.update(templateItems).set({ isArchived: true }).where(activeById(id)).run().changes === 1
			);
		}
	};
}
