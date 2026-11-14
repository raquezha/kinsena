import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/data/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	dbCredentials: { url: process.env.DB_PATH ?? 'data/kinsena.db' },
	strict: true,
	verbose: true
});
