import { expect, test } from '@playwright/test';
import {
	addDefault,
	addItem,
	finishPayday,
	markSalaryIn,
	nav,
	row,
	sheet,
	signIn
} from './support/app.ts';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
	await signIn(page);
});

test('copies defaults into the upcoming payday and tracks planned amounts', async ({ page }) => {
	await addDefault(page, 'Rent', '12,000');
	await addDefault(page, 'Electricity');
	await page.goto('/');
	await expect(row(page, 'Rent')).toContainText('₱12,000.00');
	await expect(row(page, 'Electricity')).toContainText('Set amount');
	await expect(page.getByRole('note')).toContainText('1 amount missing');

	await addItem(page, 'Groceries', '10,538.91 + 3403');
	await expect(row(page, 'Groceries')).toContainText('₱13,941.91');
	const summary = page.getByRole('region', { name: 'Payday summary' });
	await expect(summary).toContainText('₱25,941.91');
});

test('enters routing mode, decides amounts, and marks items routed with undo', async ({ page }) => {
	await markSalaryIn(page, '30,000');
	await expect(page.getByText('Left to route')).toBeVisible();
	await expect(row(page, 'Rent').getByRole('button', { name: 'Pay full' })).toBeVisible();

	await row(page, 'Rent').getByRole('button', { name: 'Pay full' }).click();
	await page.getByRole('button', { name: 'Mark Rent routed' }).click();
	await expect(page.getByRole('region', { name: /^Routed/ })).toContainText('Rent');
	await page.getByRole('status').getByRole('button', { name: 'Undo' }).click();
	await expect(page.getByRole('button', { name: 'Mark Rent routed' })).toBeVisible();

	await row(page, 'Electricity').getByRole('link').click();
	const dialog = sheet(page, 'Electricity');
	await dialog.getByLabel('Full amount').fill('2,450.5');
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog).toBeHidden();
	await expect(row(page, 'Electricity')).toContainText('₱2,450.50');
	await expect(page.getByRole('note')).toHaveCount(0);

	await page.reload();
	await expect(row(page, 'Electricity')).toContainText('₱2,450.50');
});

test('rejects an invalid amount without closing the editor', async ({ page }) => {
	await row(page, 'Groceries').getByRole('link').click();
	const dialog = sheet(page, 'Groceries');
	await dialog.getByLabel('Full amount').fill('abc');
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog.getByRole('alert')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
});

test('skips an item and offers to move it to the next payday', async ({ page }) => {
	await row(page, 'Groceries').getByRole('button', { name: 'Skip' }).click();
	const dialog = sheet(page, /Skip Groceries/);
	await expect(dialog).toBeVisible();
	await dialog.getByRole('button', { name: 'Skip this payday' }).click();
	await expect(dialog).toBeHidden();
	await expect(page.getByRole('region', { name: /^Skipped/ })).toContainText('Groceries');
});

test('deletes an item and restores it with undo', async ({ page }) => {
	await row(page, 'Electricity').getByRole('link').click();
	await sheet(page, 'Electricity').getByRole('button', { name: 'Delete' }).click();
	await expect(row(page, 'Electricity')).toHaveCount(0);
	await page.getByRole('status').getByRole('button', { name: 'Undo' }).click();
	await expect(row(page, 'Electricity')).toContainText('₱2,450.50');
	await page.reload();
	await expect(row(page, 'Electricity')).toBeVisible();
});

test('finishes a payday into read-only history and reopens it', async ({ page }) => {
	await finishPayday(page);
	await nav(page, 'History').click();
	const card = page.getByRole('button', { name: /November 15|October 15/ });
	await card.click();
	await expect(page.getByText('Rent')).toBeVisible();
	await page.getByRole('button', { name: 'Reopen this payday' }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(
		page.getByRole('heading', { level: 1, name: /November 15|October 15/ })
	).toBeVisible();
});

test('changes the currency symbol', async ({ page }) => {
	await nav(page, 'Settings').click();
	await page.getByRole('radio', { name: /US dollar/ }).check();
	await expect(page.getByRole('status')).toContainText('Currency updated');
	await nav(page, 'Active').click();
	await expect(row(page, 'Rent')).toContainText('$12,000.00');
});
