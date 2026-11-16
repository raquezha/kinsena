import { desc } from 'drizzle-orm';
import type { ActivityEvent } from '../../../domain/activity.ts';
import type { ActivityEventRepository } from '../../ports.ts';
import type { Db } from '../database.ts';
import { activityEvents } from '../schema.ts';

const columns = {
	id: activityEvents.id,
	createdAt: activityEvents.createdAt,
	action: activityEvents.action,
	paydayId: activityEvents.paydayId,
	entityType: activityEvents.entityType,
	entityId: activityEvents.entityId,
	summary: activityEvents.summary
};

export function createActivityEventRepository(db: Db): ActivityEventRepository {
	return {
		add(event) {
			return db
				.insert(activityEvents)
				.values({
					createdAt: event.createdAt,
					action: event.action,
					paydayId: event.paydayId,
					entityType: event.entityType,
					entityId: event.entityId,
					summary: event.summary
				})
				.returning({ id: activityEvents.id })
				.get().id;
		},
		listRecent(limit = 50): ActivityEvent[] {
			return db
				.select(columns)
				.from(activityEvents)
				.orderBy(desc(activityEvents.createdAt), desc(activityEvents.id))
				.limit(limit)
				.all() as ActivityEvent[];
		}
	};
}
