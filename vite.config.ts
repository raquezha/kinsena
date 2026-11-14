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
			exclude: ['src/lib/server/testing/**', '**/*.test.ts', '**/index.ts'],
			reporter: ['text', 'text-summary', 'html'],
			thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 }
		}
	}
});
