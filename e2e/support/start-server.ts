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
		HOST: '127.0.0.1',
		PORT: port,
		DB_PATH: join(dir, 'kinsena.db'),
		KINSENA_PASSWORD_FILE: passwordFile
	}
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () => child.kill(signal));
}
child.on('exit', (code) => process.exit(code ?? 0));
