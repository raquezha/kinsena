import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.ts';
import { createAppServices, systemClock } from './container.ts';

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
		const services = createAppServices({
			dbPath: join(dir, 'kinsena.db'),
			passwordFile,
			migrationsFolder: resolve('drizzle')
		});
		expect(services.auth.login('a passphrase that is long enough').ok).toBe(true);
		expect(services.settings.currency()).toBe('PHP');
		expect(systemClock.now()).toBeInstanceOf(Date);
	});
});
