// Captures Step 2 routing, proposal, holidays, moved payday, and pay calendar shots.
import { expect, test, type Page } from '@playwright/test';
import {
	addDefault,
	addDestination,
	addItem,
	clearToasts,
	markSalaryIn,
	sheet,
	signIn
} from './support/app.ts';

const OUT = '.e2e-artifacts/kinsena-step2';
const LAYOUTS = [
	{ name: 'mobile', width: 390, height: 844 },
	{ name: 'tablet', width: 834, height: 1112 },
	{ name: 'desktop', width: 1440, height: 900 }
] as const;

async function seed(page: Page): Promise<void> {
	await addDestination(page, 'BPI Savings', 'Account');
	await addDestination(page, 'Meralco', 'Biller');
	await addDefault(page, 'Rent', '12,000');
	await addDefault(page, 'Internet', '1,699');
	await addDefault(page, 'Electricity');
	await addDefault(page, 'Savings', '5,000');
	await addDefault(page, 'Phone plan', '999');
	await page.goto('/');
	await addItem(page, 'Card statement', '8,400', '2026-11-20');
	await addItem(page, 'Annual insurance', '9,200', '2026-12-02');
}

async function shot(page: Page, name: string, options?: { top?: boolean }): Promise<void> {
	await clearToasts(page);
	if (options?.top) await page.evaluate(() => window.scrollTo(0, 0));
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}/${name}.png` });
}

test('captures pay calendar, holidays, moved payday, routing, and proposal', async ({ page }) => {
	test.setTimeout(90_000);
	const fs = await import('node:fs');
	fs.mkdirSync(OUT, { recursive: true });

	await page.setViewportSize(LAYOUTS[0]);
	await signIn(page);
	await expect(page.getByRole('heading', { level: 1, name: 'November 15' })).toBeVisible();
	await expect(page.getByText(/Arrives Fri Nov 13/)).toBeVisible();
	await shot(page, 'mobile-payday-header', { top: true });

	await page.goto('/calendar');
	await expect(page.getByRole('heading', { name: 'Pay calendar' })).toBeVisible();
	await page.getByRole('heading', { name: 'November 2026' }).scrollIntoViewIfNeeded();
	await shot(page, 'mobile-pay-calendar');

	await page.setViewportSize(LAYOUTS[2]);
	await page.goto('/calendar');
	await expect(page.getByRole('heading', { name: 'Pay calendar' })).toBeVisible();
	await page.getByRole('heading', { name: 'November 2026' }).scrollIntoViewIfNeeded();
	await shot(page, 'desktop-pay-calendar');

	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/settings');
	await expect(page.getByRole('heading', { name: 'Holidays' })).toBeVisible();
	await page.getByRole('heading', { name: 'Holidays' }).scrollIntoViewIfNeeded();
	await shot(page, 'mobile-settings-holidays');

	await seed(page);
	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'November 15' })).toBeVisible();
	await shot(page, 'mobile-routing', { top: true });

	await page.setViewportSize(LAYOUTS[1]);
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'November 15' })).toBeVisible();
	await shot(page, 'tablet-routing', { top: true });

	await page.setViewportSize(LAYOUTS[2]);
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'November 15' })).toBeVisible();
	await shot(page, 'desktop-routing', { top: true });

	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/');
	const plan = await markSalaryIn(page, '38,500', { reviewPlan: true });
	await expect(plan.getByRole('heading', { name: 'Proposed split' })).toBeVisible();
	await plan.getByRole('heading', { name: 'Proposed split' }).scrollIntoViewIfNeeded();
	await shot(page, 'mobile-proposal');

	await page.setViewportSize(LAYOUTS[2]);
	await expect(
		sheet(page, 'Proposed split').getByRole('heading', { name: 'Proposed split' })
	).toBeVisible();
	await shot(page, 'desktop-proposal');
});
