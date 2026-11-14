// Regenerates docs/screenshots with example data only: `npm run screenshots`.
import { expect, test, type Page } from '@playwright/test';
import { addDefault, addItem, row, sheet, signIn, startCycle } from './support/app.ts';

const OUT = 'docs/screenshots';
const LAYOUTS = [
	{ name: 'mobile', width: 390, height: 844 },
	{ name: 'tablet', width: 834, height: 1112 },
	{ name: 'desktop', width: 1440, height: 900 }
] as const;

async function clearToasts(page: Page): Promise<void> {
	const dismiss = page.getByRole('status').getByRole('button', { name: 'Dismiss' });
	while ((await dismiss.count()) > 0) await dismiss.first().click();
}

async function seedExampleData(page: Page): Promise<void> {
	await addDefault(page, 'Rent', '12,000');
	await addDefault(page, 'Internet', '1,699');
	await addDefault(page, 'Electricity');
	await addDefault(page, 'Savings', '5,000');
	await addDefault(page, 'Phone plan', '999');
	await startCycle(page, 'November 15', '38,500');
	await addItem(page, 'Groceries', '3,200 + 1,050.75');
	for (const name of ['Internet', 'Savings']) {
		await page.getByRole('button', { name: `Mark ${name} paid` }).click();
		await expect(page.getByRole('button', { name: `Mark ${name} unpaid` })).toBeVisible();
	}
}

test('captures every layout with example data', async ({ page }) => {
	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/login');
	await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
	await page.screenshot({ path: `${OUT}/mobile-login.png` });

	await signIn(page);
	await seedExampleData(page);

	for (const layout of LAYOUTS) {
		await page.setViewportSize(layout);
		await page.goto('/');
		await expect(row(page, 'Rent')).toBeVisible();
		await clearToasts(page);
		await page.evaluate(() => window.scrollTo(0, 0));
		await page.screenshot({ path: `${OUT}/${layout.name}-checklist.png` });

		await row(page, 'Electricity').getByRole('link').click();
		await expect(sheet(page, 'Electricity')).toBeVisible();
		await page.waitForTimeout(400);
		await page.screenshot({ path: `${OUT}/${layout.name}-editor.png` });
		await page.keyboard.press('Escape');
		await expect(sheet(page, 'Electricity')).toBeHidden();
	}
});
