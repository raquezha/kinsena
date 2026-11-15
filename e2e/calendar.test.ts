import { expect, test } from '@playwright/test';
import { nav, signIn } from './support/app.ts';

test('shows the pay rule, holidays, and a full-year calendar', async ({ page }) => {
	await signIn(page);
	await expect(page.getByRole('heading', { level: 1, name: 'November 15' })).toBeVisible();
	await expect(page.getByText(/Arrives Fri Nov 13/)).toBeVisible();
	await expect(page.getByText(/moved from Sun Nov 15/)).toBeVisible();

	await nav(page, 'Settings').click();
	await expect(page.getByRole('heading', { name: 'Pay rule' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'View the full-year pay calendar' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Holidays' })).toBeVisible();
	await expect(page.getByText('Bonifacio Day').first()).toBeVisible();

	await page.getByRole('link', { name: 'View the full-year pay calendar' }).click();
	await expect(page.getByRole('heading', { name: 'Pay calendar' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'November 2026' })).toBeVisible();
	await expect(page.getByText('Scheduled November 15')).toBeVisible();
	await expect(page.getByText('Arrives November 13')).toBeVisible();
	await expect(page.getByText('Scheduled November 30')).toBeVisible();
	await expect(page.getByText('Arrives November 27')).toBeVisible();
});
