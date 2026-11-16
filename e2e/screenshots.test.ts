// Regenerates docs/screenshots with example data only: `npm run screenshots`.
import { expect, test, type Page } from '@playwright/test';
import {
	addDefault,
	addDestination,
	addItem,
	clearToasts,
	decidePayFull,
	finishPayday,
	markSalaryIn,
	openItem,
	row,
	signIn
} from './support/app.ts';

const OUT = 'docs/screenshots';
const LAYOUTS = [
	{ name: 'mobile', width: 390, height: 844 },
	{ name: 'tablet', width: 834, height: 1112 },
	{ name: 'desktop', width: 1440, height: 900 }
] as const;

async function seedDemo(page: Page): Promise<void> {
	await addDestination(page, 'BPI Savings', 'Account');
	await addDestination(page, 'GCash', 'Account');
	await addDestination(page, 'Meralco', 'Biller');
	await addDefault(page, 'Rent', '12,000');
	await addDefault(page, 'Internet', '1,699');
	await addDefault(page, 'Electricity');
	await addDefault(page, 'Savings', '5,000');
	await addDefault(page, 'Phone plan', '999');
	await page.goto('/');
	await addItem(page, 'Card statement', '8,400', '2026-11-20');
}

async function shot(page: Page, name: string, fullPage = false): Promise<void> {
	await clearToasts(page);
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.screenshot({ path: `${OUT}/${name}.png`, fullPage, animations: 'disabled' });
}

test('captures current Active, Defaults, History, and editors', async ({ page }) => {
	test.setTimeout(240_000);

	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/login');
	await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
	await shot(page, 'mobile-login');

	await signIn(page);
	await seedDemo(page);

	for (const layout of LAYOUTS) {
		await page.setViewportSize(layout);
		await page.goto('/');
		await expect(page.getByRole('region', { name: 'Payday summary' })).toBeVisible();
		await expect(row(page, 'Rent')).toBeVisible();
		await shot(page, `${layout.name}-checklist`, true);
	}

	for (const layout of LAYOUTS) {
		await page.setViewportSize(layout);
		await page.goto('/defaults');
		await expect(page.getByRole('heading', { name: 'Defaults' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Accounts and billers' })).toBeVisible();
		await shot(page, `${layout.name}-defaults`, true);
	}

	await page.setViewportSize(LAYOUTS[2]);
	await page.goto('/');
	await markSalaryIn(page, '38,500');
	await decidePayFull(page, 'Rent');
	await decidePayFull(page, 'Savings');
	await page.getByRole('button', { name: /^(Pay full and )?Mark Savings routed$/i }).click();
	await clearToasts(page);

	await openItem(page, 'Electricity');
	await expect(page.getByRole('dialog', { name: 'Electricity' })).toBeVisible();
	await page.waitForTimeout(300);
	await shot(page, 'desktop-editor');
	await page.keyboard.press('Escape');

	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/');
	await openItem(page, 'Electricity');
	await expect(page.getByRole('dialog', { name: 'Electricity' })).toBeVisible();
	await page.waitForTimeout(300);
	await shot(page, 'mobile-editor');
	await page.keyboard.press('Escape');

	await page.setViewportSize(LAYOUTS[1]);
	await page.goto('/');
	await openItem(page, 'Electricity');
	await expect(page.getByRole('dialog', { name: 'Electricity' })).toBeVisible();
	await page.waitForTimeout(300);
	await shot(page, 'tablet-editor');
	await page.keyboard.press('Escape');

	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/');
	await finishPayday(page);
	await page.goto('/history');
	await expect(page.getByRole('button', { name: 'Activity log' })).toBeVisible();

	for (const layout of LAYOUTS) {
		await page.setViewportSize(layout);
		await page.goto('/history');
		await expect(page.getByRole('button', { name: 'Activity log' })).toBeVisible();
		await shot(page, `${layout.name}-history`, true);
	}
});
