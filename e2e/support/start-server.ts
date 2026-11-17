// Starts the built app for one Playwright project with a throwaway database and passphrase.
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { E2E_PASSPHRASE } from './constants.ts';

const [name, port] = process.argv.slice(2);
if (!name || !port) throw new Error('usage: start-server.ts <name> <port>');

const dir = resolve('.e2e', name);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const passwordFile = join(dir, 'password');
writeFileSync(passwordFile, E2E_PASSPHRASE, { mode: 0o600 });

const child = spawn(process.execPath, ['server.js'], {
	stdio: 'inherit',
	env: {
		...process.env,
		// Production build + production cookie name (matches Docker / auth e2e).
		NODE_ENV: 'production',
		HOST: '127.0.0.1',
		PORT: port,
		DB_PATH: join(dir, 'kinsena.db'),
		KINSENA_PASSWORD_FILE: passwordFile,
		// Keep payday fixtures stable (tests assert November 15 as the active payday).
		KINSENA_FAKE_NOW: '2026-11-10T09:00:00'
	}
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () => child.kill(signal));
}
child.on('exit', (code) => process.exit(code ?? 0));
