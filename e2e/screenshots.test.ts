// Regenerates docs/screenshots with example data only: `npm run screenshots`.
import { expect, test, type Page } from '@playwright/test';
import {
	addDefault,
	addDestination,
	addItem,
	clearToasts,
	markSalaryIn,
	row,
	sheet,
	signIn
} from './support/app.ts';

const OUT = 'docs/screenshots';
const BOX = '/tmp/kinsena-routing-shots';
const LAYOUTS = [
	{ name: 'mobile', width: 390, height: 844 },
	{ name: 'tablet', width: 834, height: 1112 },
	{ name: 'desktop', width: 1440, height: 900 }
] as const;

async function seedPlanData(page: Page): Promise<void> {
	await addDestination(page, 'BPI Savings', 'Account');
	await addDestination(page, 'Meralco', 'Biller');
	await addDefault(page, 'Rent', '12,000');
	await addDefault(page, 'Internet', '1,699');
	await addDefault(page, 'Electricity');
	await addDefault(page, 'Savings', '5,000');
	await addDefault(page, 'Phone plan', '999');
	await page.goto('/');
	await addItem(page, 'Card statement', '8,400', '2026-11-20');
}

test('captures plan, routing and skip views', async ({ page }) => {
	const fs = await import('node:fs');
	fs.mkdirSync(BOX, { recursive: true });

	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/login');
	await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
	await page.screenshot({ path: `${OUT}/mobile-login.png` });

	await signIn(page);
	await seedPlanData(page);
	await clearToasts(page);
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.screenshot({ path: `${OUT}/mobile-checklist.png` });
	await page.screenshot({ path: `${BOX}/mobile-plan.png` });

	await markSalaryIn(page, '38,500');
	await row(page, 'Rent').getByRole('button', { name: 'Pay full' }).click();
	await row(page, 'Savings').getByRole('button', { name: 'Pay full' }).click();
	await page.getByRole('button', { name: 'Mark Savings routed' }).click();
	await clearToasts(page);
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.screenshot({ path: `${BOX}/mobile-routing.png` });

	await row(page, 'Card statement').getByRole('button', { name: 'Skip' }).click();
	await expect(sheet(page, /Skip Card statement/)).toBeVisible();
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${BOX}/mobile-skip.png` });
	await page.keyboard.press('Escape');

	await page.setViewportSize(LAYOUTS[1]);
	await page.goto('/');
	await expect(row(page, 'Rent')).toBeVisible();
	await clearToasts(page);
	await page.screenshot({ path: `${OUT}/tablet-checklist.png` });
	await page.screenshot({ path: `${BOX}/tablet-routing.png` });

	await page.setViewportSize(LAYOUTS[2]);
	await page.goto('/');
	await expect(row(page, 'Rent')).toBeVisible();
	await clearToasts(page);
	await page.screenshot({ path: `${OUT}/desktop-checklist.png` });
	await page.screenshot({ path: `${BOX}/desktop-routing.png` });

	await row(page, 'Electricity').getByRole('link').click();
	await expect(sheet(page, 'Electricity')).toBeVisible();
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}/desktop-editor.png` });
	await page.screenshot({ path: `${BOX}/desktop-editor.png` });
	await page.keyboard.press('Escape');

	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/');
	await row(page, 'Electricity').getByRole('link').click();
	await expect(sheet(page, 'Electricity')).toBeVisible();
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}/mobile-editor.png` });
	await page.screenshot({ path: `${BOX}/mobile-editor.png` });
	await page.keyboard.press('Escape');

	await page.setViewportSize(LAYOUTS[1]);
	await page.goto('/');
	await row(page, 'Electricity').getByRole('link').click();
	await expect(sheet(page, 'Electricity')).toBeVisible();
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}/tablet-editor.png` });
	await page.screenshot({ path: `${BOX}/tablet-editor.png` });
});
