import { eq } from 'drizzle-orm';
import type { PayOverrideRepository } from '../../ports.ts';
import type { Db } from '../database.ts';
import { payDateOverrides } from '../schema.ts';

export function createPayOverrideRepository(db: Db): PayOverrideRepository {
	return {
		all() {
			const rows = db.select().from(payDateOverrides).all();
			return Object.fromEntries(rows.map((row) => [row.scheduledDate, row.payDate]));
		},
		get(scheduledDate) {
			const row = db
				.select()
				.from(payDateOverrides)
				.where(eq(payDateOverrides.scheduledDate, scheduledDate))
				.get();
			return row?.payDate ?? null;
		},
		set(scheduledDate, payDate) {
			db.insert(payDateOverrides)
				.values({ scheduledDate, payDate })
				.onConflictDoUpdate({
					target: payDateOverrides.scheduledDate,
					set: { payDate }
				})
				.run();
		},
		remove: (scheduledDate) =>
			db.delete(payDateOverrides).where(eq(payDateOverrides.scheduledDate, scheduledDate)).run()
				.changes > 0
	};
}
