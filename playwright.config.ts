import { defineConfig, devices } from '@playwright/test';

const layouts = [
	{ name: 'mobile', port: 4301, viewport: { width: 390, height: 844 }, touch: true },
	{ name: 'tablet', port: 4302, viewport: { width: 834, height: 1112 }, touch: true },
	{ name: 'desktop', port: 4303, viewport: { width: 1440, height: 900 }, touch: false }
] as const;

/** One DB/port per shot file so seeds and salary-in do not leak across suites. */
const shotSuites = [
	{ name: 'screenshots', file: 'screenshots.test.ts', port: 4304 },
	{ name: 'polish-shots', file: 'polish-shots.test.ts', port: 4305 },
	{ name: 'reorder-shots', file: 'reorder-shots.test.ts', port: 4306 },
	{ name: 'step1-shots', file: 'step1-shots.test.ts', port: 4307 },
	{ name: 'step2-shots', file: 'step2-shots.test.ts', port: 4308 },
	{ name: 'step3-shots', file: 'step3-shots.test.ts', port: 4309 },
	/** Isolated DB so finishing a payday cannot pollute checklist serial suites. */
	{ name: 'activity-e2e', file: 'activity.test.ts', port: 4310 }
] as const;

const shotFiles = shotSuites.map(({ file }) => `**/${file}`);

const servers = [
	...layouts.map(({ name, port }) => ({ name, port })),
	...shotSuites.map(({ name, port }) => ({ name, port }))
];

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.test.ts',
	outputDir: 'test-results',
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
	projects: [
		...layouts.map(({ name, port, viewport, touch }) => ({
			name,
			testIgnore: shotFiles,
			use: {
				...devices['Desktop Chrome'],
				baseURL: `http://127.0.0.1:${port}`,
				viewport,
				hasTouch: touch
			}
		})),
		...shotSuites.map(({ name, file, port }) => ({
			name,
			testMatch: `**/${file}`,
			use: {
				...devices['Desktop Chrome'],
				baseURL: `http://127.0.0.1:${port}`,
				reducedMotion: 'reduce' as const
			}
		}))
	],
	webServer: servers.map(({ name, port }) => ({
		command: `node e2e/support/start-server.ts ${name} ${port}`,
		url: `http://127.0.0.1:${port}/login`,
		reuseExistingServer: false,
		timeout: 30_000
	}))
});
