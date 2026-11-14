import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { DatabaseHandle } from './database.ts';
import { upgradeLegacyMoneyColumns } from './legacy-money.ts';
import { settings } from './schema.ts';

/**
 * Brings any database up to date: the legacy REAL-to-centavos upgrade first,
 * then Drizzle migrations, then the single settings row.
 */
export function migrateDatabase(handle: DatabaseHandle, migrationsFolder: string): void {
	upgradeLegacyMoneyColumns(handle.sqlite);
	migrate(handle.db, { migrationsFolder });
	handle.db.insert(settings).values({ id: 1 }).onConflictDoNothing().run();
}
