import { resolve } from 'node:path';

export interface AppConfig {
	dbPath: string;
	passwordFile: string | undefined;
	migrationsFolder: string;
}

type Env = Record<string, string | undefined>;

export function loadConfig(env: Env, cwd = process.cwd()): AppConfig {
	return {
		dbPath: resolve(cwd, env.DB_PATH ?? 'data/kinsena.db'),
		passwordFile: env.KINSENA_PASSWORD_FILE,
		migrationsFolder: resolve(cwd, env.MIGRATIONS_DIR ?? 'drizzle')
	};
}
