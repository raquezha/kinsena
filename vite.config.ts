import { readFileSync } from 'node:fs';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string };

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: { runes: true },
			adapter: adapter({ out: 'build' }),
			// Same-origin checks run in hooks.server.ts and compare against the Host header,
			// so they keep working behind an HTTPS gateway such as Tailscale Serve.
			csrf: { trustedOrigins: ['*'] }
		})
	],
	define: {
		__APP_VERSION__: JSON.stringify(version)
	},
	server: { host: '127.0.0.1' },
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts'],
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			include: ['src/lib/domain/**', 'src/lib/server/**', 'src/lib/client/**'],
			// Browser-only glue (fetch, history, runes state) is covered by the Playwright suite.
			exclude: [
				'src/lib/server/testing/**',
				'src/lib/server/data/fixtures/**',
				'src/lib/client/actions.ts',
				'src/lib/client/sheet-route.ts',
				'**/*.svelte.ts',
				'**/*.test.ts',
				'**/index.ts',
				'src/lib/server/data/schema.ts'
			],
			reporter: ['text', 'text-summary', 'html'],
			thresholds: { lines: 97, functions: 97, statements: 97, branches: 97 }
		}
	}
});
