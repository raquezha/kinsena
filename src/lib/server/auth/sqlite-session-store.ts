import { randomBytes } from 'node:crypto';
import { eq, lte } from 'drizzle-orm';
import type { Db } from '../data/database.ts';
import { sessions as sessionsTable } from '../data/schema.ts';
import type { Clock } from '../ports.ts';
import { SESSION_TTL_SECONDS, type SessionStore } from './session-store.ts';

/** Session tokens in SQLite so a restart (or Vite reload) keeps the user signed in. */
export function createSqliteSessionStore(
	db: Db,
	clock: Clock,
	ttlSeconds = SESSION_TTL_SECONDS
): SessionStore {
	const now = () => clock.now().getTime();
	const removeExpired = () => {
		db.delete(sessionsTable).where(lte(sessionsTable.expiresAt, now())).run();
	};

	return {
		issue() {
			removeExpired();
			const token = randomBytes(32).toString('base64url');
			db.insert(sessionsTable)
				.values({ token, expiresAt: now() + ttlSeconds * 1000 })
				.run();
			return token;
		},
		isValid(token) {
			if (!token) return false;
			const row = db
				.select({ expiresAt: sessionsTable.expiresAt })
				.from(sessionsTable)
				.where(eq(sessionsTable.token, token))
				.get();
			if (!row) return false;
			if (row.expiresAt > now()) return true;
			db.delete(sessionsTable).where(eq(sessionsTable.token, token)).run();
			return false;
		},
		revoke(token) {
			if (token) db.delete(sessionsTable).where(eq(sessionsTable.token, token)).run();
		}
	};
}
