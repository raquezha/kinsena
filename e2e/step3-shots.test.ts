// Captures Step 3 routing, salary header, currency default, and settings shots.
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

const OUT = '.e2e-artifacts/kinsena-step3';
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

async function shot(
	page: Page,
	name: string,
	options?: { top?: boolean; fullPage?: boolean }
): Promise<void> {
	await clearToasts(page);
	if (options?.top) await page.evaluate(() => window.scrollTo(0, 0));
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: options?.fullPage });
}

test('captures routing, salary header, PHP currency default, and settings', async ({ page }) => {
	test.setTimeout(90_000);
	const fs = await import('node:fs');
	fs.mkdirSync(OUT, { recursive: true });

	await page.setViewportSize(LAYOUTS[0]);
	await signIn(page);
	await expect(page.getByRole('heading', { level: 1, name: 'November 15' })).toBeVisible();
	await expect(page.getByText(/Arrives Fri Nov 13/)).toBeVisible();
	await shot(page, 'mobile-payday-header', { top: true });

	await page.setViewportSize(LAYOUTS[2]);
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'November 15' })).toBeVisible();
	await shot(page, 'desktop-payday-header', { top: true });

	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/settings');
	await expect(page.getByRole('group', { name: 'Currency' })).toBeVisible();
	await expect(page.getByRole('radio', { name: /Philippine peso/ })).toBeChecked();
	await expect(page.getByText('Default', { exact: true })).toBeVisible();
	await expect(page.getByRole('radio', { name: /US dollar/ })).toBeVisible();
	await page.getByRole('group', { name: 'Currency' }).scrollIntoViewIfNeeded();
	await shot(page, 'mobile-settings-currency');

	await page.setViewportSize(LAYOUTS[2]);
	await page.goto('/settings');
	await expect(page.getByRole('group', { name: 'Currency' })).toBeVisible();
	await expect(page.getByRole('radio', { name: /Philippine peso/ })).toBeChecked();
	await expect(page.getByText('Default', { exact: true })).toBeVisible();
	await expect(page.getByRole('radio', { name: /US dollar/ })).toBeVisible();
	await page.getByRole('group', { name: 'Currency' }).scrollIntoViewIfNeeded();
	await shot(page, 'desktop-settings-currency');

	await page.getByRole('heading', { name: 'Pay rule' }).scrollIntoViewIfNeeded();
	await shot(page, 'desktop-settings', { fullPage: true });

	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/settings');
	await expect(page.getByRole('heading', { name: 'Pay rule' })).toBeVisible();
	await page.getByRole('heading', { name: 'Pay rule' }).scrollIntoViewIfNeeded();
	await shot(page, 'mobile-settings');

	await page.goto('/defaults');
	await page.getByRole('link', { name: 'Add destination' }).click();
	const destination = sheet(page, 'New destination');
	await expect(destination).toBeVisible();
	await expect(destination.getByRole('radio', { name: 'Account' })).toBeChecked();
	await expect(destination.getByRole('radio', { name: 'Biller' })).toBeVisible();
	await shot(page, 'mobile-destination-kind');
	await destination.getByRole('link', { name: 'Close' }).click();

	await seed(page);
	const plan = await markSalaryIn(page, '38,500', { reviewPlan: true });
	await expect(plan.getByRole('heading', { name: 'Proposed split' })).toBeVisible();
	await page.setViewportSize(LAYOUTS[0]);
	await plan.getByRole('heading', { name: 'Proposed split' }).scrollIntoViewIfNeeded();
	await shot(page, 'mobile-proposal');
	await plan.getByRole('button', { name: 'Approve all' }).click();
	await expect(plan).toBeHidden();

	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'November 15' })).toBeVisible();
	const payFull = page.getByRole('button', { name: 'Pay full' }).first();
	await expect(payFull).toBeVisible();
	await payFull.evaluate((element) =>
		element.scrollIntoView({ block: 'center', inline: 'nearest' })
	);
	await shot(page, 'mobile-routing');

	await page.setViewportSize(LAYOUTS[1]);
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'November 15' })).toBeVisible();
	await shot(page, 'tablet-routing', { top: true });

	await page.setViewportSize(LAYOUTS[2]);
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'November 15' })).toBeVisible();
	await shot(page, 'desktop-routing', { top: true });
});
