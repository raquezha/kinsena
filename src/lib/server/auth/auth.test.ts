import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { openDatabase } from '../data/database.ts';
import { migrateDatabase } from '../data/migrate.ts';
import { createTestClock } from '../testing/clock.ts';
import { createAuthService } from './auth-service.ts';
import { createFailureLimiter } from './failure-limiter.ts';
import { ConfigurationError, createPassphraseVerifier, readPassphraseFile } from './passphrase.ts';
import { createSessionStore, SESSION_TTL_SECONDS } from './session-store.ts';
import { createSqliteSessionStore } from './sqlite-session-store.ts';

const PASSPHRASE = 'correct horse battery staple';
const MIGRATIONS = resolve('drizzle');

function setup() {
	const clock = createTestClock();
	const sessions = createSessionStore(clock);
	const limiter = createFailureLimiter({ limit: 10, windowMs: 60_000, clock });
	const verify = createPassphraseVerifier(PASSPHRASE);
	return { clock, sessions, auth: createAuthService({ verify, sessions, limiter }) };
}

describe('passphrase file', () => {
	const write = (content: string) => {
		const path = join(mkdtempSync(join(tmpdir(), 'kinsena-auth-')), 'password');
		writeFileSync(path, content);
		return path;
	};

	it('reads the passphrase without the trailing newline', () => {
		expect(readPassphraseFile(write(`${PASSPHRASE}\r\n`))).toBe(PASSPHRASE);
	});

	it('refuses to start without a file or with a short passphrase', () => {
		expect(() => readPassphraseFile(undefined)).toThrow(ConfigurationError);
		expect(() => readPassphraseFile(write('fifteen-chars!!'))).toThrow('at least 16 characters');
	});

	it('verifies candidates of any length safely', () => {
		const verify = createPassphraseVerifier(PASSPHRASE);
		expect(verify(PASSPHRASE)).toBe(true);
		expect(verify(PASSPHRASE.toUpperCase())).toBe(false);
		expect(verify('')).toBe(false);
		expect(verify('x'.repeat(5000))).toBe(false);
	});
});

describe('sessions', () => {
	it('issues random tokens that can be revoked', () => {
		const { auth } = setup();
		const result = auth.login(PASSPHRASE);
		if (!result.ok) throw new Error('login failed');
		expect(result.token).toMatch(/^[\w-]{43}$/);
		expect(auth.isSignedIn(result.token)).toBe(true);
		expect(auth.isSignedIn(`${result.token}a`)).toBe(false);
		expect(auth.isSignedIn(null)).toBe(false);
		expect(setup().auth.isSignedIn(result.token)).toBe(false);
		auth.logout(result.token);
		auth.logout(undefined);
		expect(auth.isSignedIn(result.token)).toBe(false);
	});

	it('expires after seven days', () => {
		const { clock, sessions } = setup();
		const token = sessions.issue();
		clock.advance(SESSION_TTL_SECONDS * 1000 - 1);
		expect(sessions.isValid(token)).toBe(true);
		clock.advance(1);
		expect(sessions.isValid(token)).toBe(false);
	});

	it('drops expired sessions when issuing new ones', () => {
		const { clock, sessions } = setup();
		const old = sessions.issue();
		clock.advance(SESSION_TTL_SECONDS * 1000);
		const fresh = sessions.issue();
		expect(sessions.isValid(old)).toBe(false);
		expect(sessions.isValid(fresh)).toBe(true);
	});

	it('keeps SQLite sessions across store recreation', () => {
		const clock = createTestClock();
		const handle = openDatabase(':memory:');
		migrateDatabase(handle, MIGRATIONS);
		const first = createSqliteSessionStore(handle.db, clock);
		const token = first.issue();
		const second = createSqliteSessionStore(handle.db, clock);
		expect(second.isValid(token)).toBe(true);
		const other = first.issue();
		second.revoke(other);
		expect(second.isValid(other)).toBe(false);
		clock.advance(SESSION_TTL_SECONDS * 1000);
		expect(second.isValid(token)).toBe(false);
		handle.close();
	});
});

describe('login rate limit', () => {
	it('blocks after ten failures in a minute, even the right passphrase', () => {
		const { auth, clock } = setup();
		for (let attempt = 0; attempt < 10; attempt++) {
			expect(auth.login(`wrong ${attempt}`)).toEqual({ ok: false, reason: 'invalid' });
		}
		expect(auth.login(PASSPHRASE)).toEqual({ ok: false, reason: 'rate-limited' });
		clock.advance(60_001);
		expect(auth.login(PASSPHRASE).ok).toBe(true);
	});

	it('resets the counter after a successful login', () => {
		const { auth } = setup();
		for (let attempt = 0; attempt < 9; attempt++) auth.login('wrong');
		expect(auth.login(PASSPHRASE).ok).toBe(true);
		for (let attempt = 0; attempt < 9; attempt++) auth.login('wrong');
		expect(auth.login(PASSPHRASE).ok).toBe(true);
	});
});
