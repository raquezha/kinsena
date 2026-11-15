import { eq } from 'drizzle-orm';
import type { Holiday } from '../../../domain/models.ts';
import type { HolidayRepository, NewHoliday } from '../../ports.ts';
import type { Db } from '../database.ts';
import { holidays } from '../schema.ts';

const publicOf = (row: Holiday): Holiday => ({
	id: row.id,
	date: row.date,
	name: row.name,
	kind: row.kind
});

export function createHolidayRepository(db: Db): HolidayRepository {
	return {
		list: () =>
			db.select().from(holidays).orderBy(holidays.date, holidays.name).all().map(publicOf),
		findById: (id) => {
			const row = db.select().from(holidays).where(eq(holidays.id, id)).get();
			return row ? publicOf(row) : null;
		},
		add(holiday: NewHoliday) {
			const result = db.insert(holidays).values(holiday).returning({ id: holidays.id }).get();
			return result.id;
		},
		remove: (id) => db.delete(holidays).where(eq(holidays.id, id)).run().changes > 0
	};
}
