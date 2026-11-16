import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import {
	addItem,
	clearToasts,
	finishPayday,
	markRouted,
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

test('History Activity feed lists key actions only and stays screenshot-stable', async ({
	page
}) => {
	test.setTimeout(90_000);
	await signIn(page);
	await clearToasts(page);

	await nav(page, 'History').click();
	await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Activity log' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Activity log' })).toHaveCount(0);
	await expect(page.getByText('When you finish a payday it will live here.')).toBeVisible();

	await nav(page, 'Active').click();
	await addItem(page, 'Activity Rent', '12,000');
	await addItem(page, 'Activity Water', '500');

	await nav(page, 'History').click();
	await page.getByRole('button', { name: 'Activity log' }).click();
	const activity = page.getByRole('dialog', { name: 'Activity log' });
	await expect(activity).toBeVisible();
	await expect(activity.getByText('Added Activity Rent')).toBeVisible();
	await expect(activity.getByText('Added Activity Water')).toBeVisible();
	await expect(activity.getByText(/Salary|receive|approve/i)).toHaveCount(0);
	await activity.getByRole('link', { name: 'Close' }).click();
	await expect(activity).toBeHidden();

	await nav(page, 'Active').click();
	await markSalaryIn(page, '50,000');
	await markRouted(page, 'Activity Rent');
	await expect(page.getByRole('region', { name: /^Routed/ })).toContainText('Activity Rent');

	await (await openItem(page, 'Activity Water')).getByRole('button', { name: 'Delete' }).click();
	await expect(row(page, 'Activity Water')).toHaveCount(0);

	await nav(page, 'History').click();
	await page.getByRole('button', { name: 'Activity log' }).click();
	const later = page.getByRole('dialog', { name: 'Activity log' });
	await expect(later.getByText('Chose full for Activity Rent')).toBeVisible();
	await expect(later.getByText('Marked Activity Rent routed')).toBeVisible();
	await expect(later.getByText('Removed Activity Water')).toBeVisible();
	await expect(later.getByText(/Salary|receive|note|reorder|approve/i)).toHaveCount(0);
	await later.getByRole('link', { name: 'Close' }).click();

	await nav(page, 'Active').click();
	await finishPayday(page);

	await nav(page, 'History').click();
	await page.getByRole('button', { name: 'Activity log' }).click();
	const finished = page.getByRole('dialog', { name: 'Activity log' });
	await expect(finished.getByText(/^Finished /).first()).toBeVisible();
	await expect(finished.getByText(/Salary|receive|approve/i)).toHaveCount(0);
	await finished.getByRole('link', { name: 'Close' }).click();
	const openStatement = page.getByRole('button', {
		name: /Open statement for (November 15|October 15)/
	});
	await expect(openStatement).toBeVisible();
	await openStatement.click();
	const statement = page.getByRole('dialog', { name: /November 15|October 15/ });
	await expect(statement).toBeVisible();
	await expect(
		statement.getByRole('region', { name: /Statement for (November 15|October 15)/ })
	).toBeVisible();
	await expect(page.locator('aside.detail')).toHaveCount(0);
	await statement.getByRole('link', { name: 'Close' }).click();
	await expect(statement).toBeHidden();

	mkdirSync(OUT, { recursive: true });
	for (const viewport of VIEWPORTS) {
		await page.setViewportSize({ width: viewport.width, height: viewport.height });
		await page.goto('/history');
		await clearToasts(page);
		await expect(page.locator('aside.detail')).toHaveCount(0);
		await expect(page.locator('.cards')).toHaveCSS(
			'grid-template-columns',
			/^(minmax\(0,\s*1fr\)|[0-9.]+px)$/
		);
		await page.getByRole('button', { name: 'Activity log' }).click();
		const shotDialog = page.getByRole('dialog', { name: 'Activity log' });
		await expect(shotDialog.getByText(/^Finished /).first()).toBeVisible();
		await page.screenshot({
			path: `${OUT}/${viewport.name}-history-activity.png`,
			fullPage: true,
			animations: 'disabled'
		});
		await shotDialog.getByRole('link', { name: 'Close' }).click();
		await openStatement.click();
		await expect(statement).toBeVisible();
		await page.screenshot({
			path: `${OUT}/${viewport.name}-history-statement.png`,
			fullPage: true,
			animations: 'disabled'
		});
		await statement.getByRole('link', { name: 'Close' }).click();
	}
});
