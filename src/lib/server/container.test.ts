import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.ts';
import { clockFromEnv, createAppServices, systemClock } from './container.ts';

describe('app wiring', () => {
	it('loads defaults and env overrides', () => {
		expect(loadConfig({}, '/srv')).toEqual({
			dbPath: '/srv/data/kinsena.db',
			passwordFile: undefined,
			migrationsFolder: '/srv/drizzle'
		});
		const config = loadConfig({
			DB_PATH: '/x/k.db',
			KINSENA_PASSWORD_FILE: '/p',
			MIGRATIONS_DIR: 'm'
		});
		expect(config).toMatchObject({ dbPath: '/x/k.db', passwordFile: '/p' });
		expect(config.migrationsFolder).toBe(resolve('m'));
	});

	it('refuses to start without a valid passphrase file', () => {
		const config = { ...loadConfig({}), dbPath: ':memory:' };
		expect(() => createAppServices(config)).toThrow('KINSENA_PASSWORD_FILE');
	});

	it('builds working services from config', () => {
		const dir = mkdtempSync(join(tmpdir(), 'kinsena-app-'));
		const passwordFile = join(dir, 'password');
		writeFileSync(passwordFile, 'a passphrase that is long enough\n');
		const config = {
			dbPath: join(dir, 'kinsena.db'),
			passwordFile,
			migrationsFolder: resolve('drizzle')
		};
		const services = createAppServices(config);
		const login = services.auth.login('a passphrase that is long enough');
		expect(login.ok).toBe(true);
		if (!login.ok) throw new Error('login failed');
		expect(services.settings.currency()).toBe('PHP');
		expect(systemClock.now()).toBeInstanceOf(Date);
		// New process / Vite reload opens the same DB — session must still count.
		const afterRestart = createAppServices(config);
		expect(afterRestart.auth.isSignedIn(login.token)).toBe(true);
		afterRestart.auth.logout(login.token);
		expect(createAppServices(config).auth.isSignedIn(login.token)).toBe(false);
	});

	it('uses KINSENA_FAKE_NOW when set', () => {
		expect(clockFromEnv({}).now()).toBeInstanceOf(Date);
		expect(clockFromEnv({ KINSENA_FAKE_NOW: '2026-11-10T09:00:00' }).now().toISOString()).toMatch(
			/^2026-11-10/
		);
		expect(() => clockFromEnv({ KINSENA_FAKE_NOW: 'nope' })).toThrow(/KINSENA_FAKE_NOW/);
	});
});
