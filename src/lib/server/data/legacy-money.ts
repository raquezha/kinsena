import type Database from 'better-sqlite3';

// Kinsena 0.1 first stored money as REAL pesos. Later builds use integer centavos.
// This one-time upgrade rewrites any REAL money column as BIGINT centavos.

interface ColumnInfo {
	name: string;
	type: string;
}

interface LegacyTable {
	table: string;
	moneyColumn: string;
	createSql: string;
	columns: string[];
}

const toCents = (column: string, nullable: boolean) =>
	nullable
		? `CASE WHEN ${column} IS NULL THEN NULL ELSE CAST(ROUND(${column} * 100) AS INTEGER) END`
		: `CAST(ROUND(${column} * 100) AS INTEGER)`;

const LEGACY_TABLES: LegacyTable[] = [
	{
		table: 'template_items',
		moneyColumn: 'default_amount',
		columns: ['id', 'name', 'default_amount', 'cadence', 'is_archived', 'created_at'],
		createSql: `id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(128) NOT NULL,
			default_amount BIGINT NULL, cadence VARCHAR(32) DEFAULT 'ANY' NOT NULL,
			is_archived BOOLEAN DEFAULT 0 NOT NULL, created_at BIGINT NOT NULL`
	},
	{
		table: 'cycles',
		moneyColumn: 'salary',
		columns: ['id', 'title', 'date', 'salary', 'note', 'is_closed', 'created_at'],
		createSql: `id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(128) NOT NULL,
			date VARCHAR(32) NOT NULL, salary BIGINT NULL, note TEXT NULL,
			is_closed BOOLEAN DEFAULT 0 NOT NULL, created_at BIGINT NOT NULL`
	},
	{
		table: 'cycle_items',
		moneyColumn: 'amount',
		columns: ['id', 'cycle_id', 'name', 'amount', 'amount_expr', 'is_done', 'sort_order'],
		createSql: `id INTEGER PRIMARY KEY AUTOINCREMENT, cycle_id BIGINT NOT NULL,
			name VARCHAR(128) NOT NULL, amount BIGINT DEFAULT 0 NOT NULL,
			amount_expr VARCHAR(256) NULL, is_done BOOLEAN DEFAULT 0 NOT NULL,
			sort_order INT DEFAULT 0 NOT NULL, FOREIGN KEY (cycle_id) REFERENCES cycles(id)`
	}
];

export function isFloatingColumn(sqlite: Database.Database, table: string, column: string) {
	const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all() as ColumnInfo[];
	const type = columns.find((info) => info.name === column)?.type.toUpperCase() ?? '';
	return ['REAL', 'DOUBLE', 'FLOAT'].some((floating) => type.includes(floating));
}

function rebuild(sqlite: Database.Database, legacy: LegacyTable): void {
	const { table, moneyColumn, columns } = legacy;
	const select = columns
		.map((column) => (column === moneyColumn ? toCents(column, column !== 'amount') : column))
		.join(', ');
	sqlite.exec(`CREATE TABLE ${table}_new (${legacy.createSql})`);
	sqlite.exec(`INSERT INTO ${table}_new (${columns.join(', ')}) SELECT ${select} FROM ${table}`);
	sqlite.exec(`DROP TABLE ${table}`);
	sqlite.exec(`ALTER TABLE ${table}_new RENAME TO ${table}`);
}

/** Returns the tables that were upgraded. Safe to run on every start. */
export function upgradeLegacyMoneyColumns(sqlite: Database.Database): string[] {
	const pending = LEGACY_TABLES.filter((legacy) =>
		isFloatingColumn(sqlite, legacy.table, legacy.moneyColumn)
	);
	if (pending.length === 0) return [];
	sqlite.pragma('foreign_keys = OFF');
	try {
		sqlite.transaction(() => pending.forEach((legacy) => rebuild(sqlite, legacy)))();
	} finally {
		sqlite.pragma('foreign_keys = ON');
	}
	return pending.map((legacy) => legacy.table);
}
