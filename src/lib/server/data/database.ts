import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.ts';

export type Db = BetterSQLite3Database<typeof schema>;

export interface DatabaseHandle {
	sqlite: Database.Database;
	db: Db;
	close(): void;
}

/** Opens (and creates, if needed) the SQLite file. Use ':memory:' in tests. */
export function openDatabase(path: string): DatabaseHandle {
	if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
	const sqlite = new Database(path);
	sqlite.pragma('foreign_keys = ON');
	sqlite.pragma('busy_timeout = 5000');
	const db = drizzle(sqlite, { schema });
	return { sqlite, db, close: () => sqlite.close() };
}
