import { defineConfig, devices } from '@playwright/test';

const layouts = [
	{ name: 'mobile', port: 4301, viewport: { width: 390, height: 844 }, touch: true },
	{ name: 'tablet', port: 4302, viewport: { width: 834, height: 1112 }, touch: true },
	{ name: 'desktop', port: 4303, viewport: { width: 1440, height: 900 }, touch: false }
] as const;
const SCREENSHOT_PORT = 4304;

const servers = [
	...layouts.map(({ name, port }) => ({ name, port })),
	{
		name: 'screenshots',
		port: SCREENSHOT_PORT
	}
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
			testIgnore: ['**/screenshots.test.ts', '**/polish-shots.test.ts'],
			use: {
				...devices['Desktop Chrome'],
				baseURL: `http://127.0.0.1:${port}`,
				viewport,
				hasTouch: touch
			}
		})),
		{
			name: 'screenshots',
			testMatch: ['**/screenshots.test.ts', '**/polish-shots.test.ts'],
			use: {
				...devices['Desktop Chrome'],
				baseURL: `http://127.0.0.1:${SCREENSHOT_PORT}`,
				reducedMotion: 'reduce'
			}
		}
	],
	webServer: servers.map(({ name, port }) => ({
		command: `node e2e/support/start-server.ts ${name} ${port}`,
		url: `http://127.0.0.1:${port}/login`,
		reuseExistingServer: false,
		timeout: 30_000
	}))
});
