import { asc, desc, eq } from 'drizzle-orm';
import type { Payday } from '../../../domain/models.ts';
import type { PaydayRepository } from '../../ports.ts';
import type { Db } from '../database.ts';
import { paydays } from '../schema.ts';

const columns = {
	id: paydays.id,
	title: paydays.title,
	cadence: paydays.cadence,
	scheduledDate: paydays.scheduledDate,
	payDate: paydays.payDate,
	expectedAmount: paydays.expectedAmount,
	receivedAmount: paydays.receivedAmount,
	receivedAt: paydays.receivedAt,
	note: paydays.note,
	isClosed: paydays.isClosed
};

export function createPaydayRepository(db: Db): PaydayRepository {
	const first = (rows: Payday[]) => rows[0] ?? null;

	return {
		findById: (id) => first(db.select(columns).from(paydays).where(eq(paydays.id, id)).all()),
		findByScheduledDate: (scheduledDate) =>
			first(
				db
					.select(columns)
					.from(paydays)
					.where(eq(paydays.scheduledDate, scheduledDate))
					.orderBy(desc(paydays.id))
					.limit(1)
					.all()
			),
		listOpen: () =>
			db
				.select(columns)
				.from(paydays)
				.where(eq(paydays.isClosed, false))
				.orderBy(asc(paydays.scheduledDate), asc(paydays.id))
				.all(),
		listClosed: () =>
			db
				.select(columns)
				.from(paydays)
				.where(eq(paydays.isClosed, true))
				.orderBy(desc(paydays.scheduledDate), desc(paydays.id))
				.all(),
		findLatest: () =>
			first(db.select(columns).from(paydays).orderBy(desc(paydays.id)).limit(1).all()),
		create(payday) {
			return db.insert(paydays).values(payday).returning({ id: paydays.id }).get().id;
		},
		update(id, patch) {
			if (Object.keys(patch).length === 0) return false;
			return db.update(paydays).set(patch).where(eq(paydays.id, id)).run().changes === 1;
		}
	};
}
