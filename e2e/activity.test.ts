import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import {
	addItem,
	clearToasts,
	finishPayday,
	markSalaryIn,
	nav,
	openItem,
	row,
	signIn
} from './support/app.ts';

const OUT = '/tmp/kinsena-activity-shots';

const VIEWPORTS = [
	{ name: 'mobile', width: 390, height: 844 },
	{ name: 'tablet', width: 768, height: 1024 },
	{ name: 'desktop', width: 1280, height: 900 }
] as const;

test('History Activity feed lists key actions only and stays screenshot-stable', async ({ page }) => {
	test.setTimeout(90_000);
	await signIn(page);
	await clearToasts(page);

	await nav(page, 'History').click();
	await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Activity' })).toHaveCount(0);
	await expect(page.getByText('When you finish a payday it will live here.')).toBeVisible();

	await nav(page, 'Active').click();
	await addItem(page, 'Activity Rent', '12,000');
	await addItem(page, 'Activity Water', '500');

	await nav(page, 'History').click();
	await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
	await expect(page.getByText('Added Activity Rent')).toBeVisible();
	await expect(page.getByText('Added Activity Water')).toBeVisible();
	await expect(page.locator('section.activity').getByText(/Salary|receive|approve/i)).toHaveCount(0);

	await nav(page, 'Active').click();
	await markSalaryIn(page, '50,000');
	await row(page, 'Activity Rent').getByRole('button', { name: 'Pay full' }).click();
	await page.getByRole('button', { name: 'Mark Activity Rent routed' }).click();
	await expect(page.getByRole('region', { name: /^Routed/ })).toContainText('Activity Rent');

	await (await openItem(page, 'Activity Water')).getByRole('button', { name: 'Delete' }).click();
	await expect(row(page, 'Activity Water')).toHaveCount(0);

	await nav(page, 'History').click();
	const activity = page.locator('section.activity');
	await expect(activity.getByText('Chose full for Activity Rent')).toBeVisible();
	await expect(activity.getByText('Marked Activity Rent routed')).toBeVisible();
	await expect(activity.getByText('Removed Activity Water')).toBeVisible();
	await expect(activity.getByText(/Salary|receive|note|reorder|approve/i)).toHaveCount(0);

	await nav(page, 'Active').click();
	await finishPayday(page);

	await nav(page, 'History').click();
	await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
	await expect(activity.getByText(/^Finished /).first()).toBeVisible();
	await expect(page.getByRole('button', { name: /November 15|October 15/ })).toBeVisible();
	await expect(activity.getByText(/Salary|receive|approve/i)).toHaveCount(0);

	mkdirSync(OUT, { recursive: true });
	for (const viewport of VIEWPORTS) {
		await page.setViewportSize({ width: viewport.width, height: viewport.height });
		await page.goto('/history');
		await clearToasts(page);
		await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
		await expect(page.getByText(/^Finished /).first()).toBeVisible();
		await page.screenshot({
			path: `${OUT}/${viewport.name}-history-activity.png`,
			fullPage: true,
			animations: 'disabled'
		});
	}
});
