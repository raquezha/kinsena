import type { FailureLimiter } from './failure-limiter.ts';
import type { PassphraseVerifier } from './passphrase.ts';
import type { SessionStore } from './session-store.ts';

export type LoginResult =
	{ ok: true; token: string } | { ok: false; reason: 'invalid' | 'rate-limited' };

export interface AuthService {
	login(candidate: string): LoginResult;
	isSignedIn(token: string | null | undefined): boolean;
	logout(token: string | null | undefined): void;
}

interface Deps {
	verify: PassphraseVerifier;
	sessions: SessionStore;
	limiter: FailureLimiter;
}

export function createAuthService({ verify, sessions, limiter }: Deps): AuthService {
	return {
		login(candidate) {
			if (limiter.isBlocked()) return { ok: false, reason: 'rate-limited' };
			if (!verify(candidate)) {
				limiter.recordFailure();
				return { ok: false, reason: 'invalid' };
			}
			limiter.reset();
			return { ok: true, token: sessions.issue() };
		},
		isSignedIn: (token) => sessions.isValid(token),
		logout: (token) => sessions.revoke(token)
	};
}
