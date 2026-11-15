// Captures Step 1 proposal, routing, and finish-check shots.
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

const OUT = '.e2e-artifacts/kinsena-step1';
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

test('captures proposal, routing with reasons, and finish check', async ({ page }) => {
	test.setTimeout(60_000);
	const fs = await import('node:fs');
	fs.mkdirSync(OUT, { recursive: true });

	await page.setViewportSize(LAYOUTS[0]);
	await signIn(page);
	await seed(page);
	const plan = await markSalaryIn(page, '38,500', { reviewPlan: true });
	await expect(plan.getByRole('heading', { name: 'Proposed split' })).toBeVisible();
	await plan.getByRole('heading', { name: 'Proposed split' }).scrollIntoViewIfNeeded();
	await expect(plan.getByText(/Left after this split/)).toBeVisible();
	await clearToasts(page);
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}/mobile-proposal.png` });

	await page.setViewportSize(LAYOUTS[1]);
	await expect(plan.getByRole('heading', { name: 'Proposed split' })).toBeVisible();
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}/tablet-proposal.png` });

	await page.setViewportSize(LAYOUTS[2]);
	await expect(plan.getByRole('heading', { name: 'Proposed split' })).toBeVisible();
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}/desktop-proposal.png` });

	await page.setViewportSize(LAYOUTS[0]);
	await plan.getByRole('button', { name: 'Approve all' }).click();
	await expect(plan).toBeHidden();
	await page.getByRole('button', { name: 'Mark Rent routed' }).click();
	await expect(page.getByRole('status').getByRole('button', { name: 'Undo' }).last()).toBeVisible();
	await expect(row(page, 'Rent')).toContainText(/Full:|Minimum:|Skip:/);
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}/mobile-routing.png` });

	await page.setViewportSize(LAYOUTS[2]);
	await page.goto('/');
	await expect(row(page, 'Rent')).toBeVisible();
	await clearToasts(page);
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}/desktop-routing.png` });

	await page.setViewportSize(LAYOUTS[0]);
	await page.goto('/');
	await page.getByRole('link', { name: 'Salary, note and finish' }).click();
	const cycle = sheet(page, 'This payday');
	await cycle.getByRole('button', { name: 'Finish payday' }).click();
	const review = sheet(page, 'Before you finish');
	await expect(review).toBeVisible();
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}/mobile-finish-check.png` });
});
