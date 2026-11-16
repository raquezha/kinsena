import { randomBytes } from 'node:crypto';
import type { Clock } from '../ports.ts';

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface SessionStore {
	issue(): string;
	isValid(token: string | null | undefined): boolean;
	revoke(token: string | null | undefined): void;
}

/** In-memory sessions for unit tests. Production uses createSqliteSessionStore. */
export function createSessionStore(clock: Clock, ttlSeconds = SESSION_TTL_SECONDS) {
	const sessions = new Map<string, number>();
	const now = () => clock.now().getTime();
	const removeExpired = () => {
		for (const [token, expiresAt] of sessions) {
			if (expiresAt <= now()) sessions.delete(token);
		}
	};

	const store: SessionStore = {
		issue() {
			removeExpired();
			const token = randomBytes(32).toString('base64url');
			sessions.set(token, now() + ttlSeconds * 1000);
			return token;
		},
		isValid(token) {
			if (!token) return false;
			const expiresAt = sessions.get(token);
			if (expiresAt === undefined) return false;
			if (expiresAt > now()) return true;
			sessions.delete(token);
			return false;
		},
		revoke(token) {
			if (token) sessions.delete(token);
		}
	};
	return store;
}
