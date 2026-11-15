import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { signIn } from './support/app.ts';

async function expectNoSeriousViolations(page: Page, where: string): Promise<void> {
	const results = await new AxeBuilder({ page }).analyze();
	const serious = results.violations.filter(
		(violation) => violation.impact === 'critical' || violation.impact === 'serious'
	);
	expect(serious, where).toEqual([]);
}

test('login and signed-in pages meet axe serious contrast and a11y checks', async ({ page }) => {
	for (const scheme of ['light', 'dark'] as const) {
		await page.emulateMedia({ colorScheme: scheme });
		await page.goto('/login');
		await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
		await expectNoSeriousViolations(page, `/login (${scheme})`);

		await signIn(page);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

		for (const path of ['/', '/history', '/defaults', '/settings', '/calendar']) {
			await page.goto(path);
			await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
			await expectNoSeriousViolations(page, `${path} (${scheme})`);
		}
		await page.context().clearCookies();
	}
});
