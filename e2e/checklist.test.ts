import { expect, test } from '@playwright/test';
import {
	addDefault,
	addItem,
	finishCycle,
	nav,
	row,
	sheet,
	signIn,
	startCycle
} from './support/app.ts';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
	await signIn(page);
});

test('copies defaults into a new cycle and tracks totals', async ({ page }) => {
	await addDefault(page, 'Rent', '12,000');
	await addDefault(page, 'Electricity');
	await startCycle(page, 'November 15', '30,000');

	await expect(row(page, 'Rent')).toContainText('₱12,000.00');
	await expect(row(page, 'Electricity')).toContainText('Set amount');
	await expect(page.getByRole('note')).toContainText('1 amount missing');

	await addItem(page, 'Groceries', '10,538.91 + 3403');
	await expect(row(page, 'Groceries')).toContainText('₱13,941.91');
	const summary = page.getByRole('region', { name: 'Cycle summary' });
	await expect(summary).toContainText('₱25,941.91');
});

test('marks items paid with undo and edits amounts', async ({ page }) => {
	await page.getByRole('button', { name: 'Mark Rent paid' }).click();
	await expect(page.getByRole('region', { name: /^Paid/ })).toContainText('Rent');
	await page.getByRole('status').getByRole('button', { name: 'Undo' }).click();
	await expect(page.getByRole('button', { name: 'Mark Rent paid' })).toBeVisible();

	await row(page, 'Electricity').getByRole('link').click();
	const dialog = sheet(page, 'Electricity');
	await dialog.getByLabel('Amount').fill('2,450.5');
	await dialog.getByRole('button', { name: 'Save amount' }).click();
	await expect(dialog).toBeHidden();
	await expect(row(page, 'Electricity')).toContainText('₱2,450.50');
	await expect(page.getByRole('note')).toHaveCount(0);

	await page.reload();
	await expect(row(page, 'Electricity')).toContainText('₱2,450.50');
});

test('rejects an invalid amount without closing the editor', async ({ page }) => {
	await row(page, 'Groceries').getByRole('link').click();
	const dialog = sheet(page, 'Groceries');
	await dialog.getByLabel('Amount').fill('abc');
	await dialog.getByRole('button', { name: 'Save amount' }).click();
	await expect(dialog.getByRole('alert')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
});

test('deletes an item and restores it with undo', async ({ page }) => {
	await row(page, 'Groceries').getByRole('link').click();
	await sheet(page, 'Groceries').getByRole('button', { name: 'Delete' }).click();
	await expect(row(page, 'Groceries')).toHaveCount(0);
	await page.getByRole('status').getByRole('button', { name: 'Undo' }).click();
	await expect(row(page, 'Groceries')).toContainText('₱13,941.91');
	await page.reload();
	await expect(row(page, 'Groceries')).toBeVisible();
});

test('finishes a cycle into read-only history and reopens it', async ({ page }) => {
	await finishCycle(page);
	await nav(page, 'History').click();
	const card = page.getByRole('button', { name: /November 15/ });
	await card.click();
	await expect(page.getByText('Groceries')).toBeVisible();
	await page.getByRole('button', { name: 'Reopen this cycle' }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole('heading', { level: 1, name: 'November 15' })).toBeVisible();
});

test('changes the currency symbol', async ({ page }) => {
	await nav(page, 'Settings').click();
	await page.getByRole('radio', { name: /US dollar/ }).check();
	await expect(page.getByRole('status')).toContainText('Currency updated');
	await nav(page, 'Active').click();
	await expect(row(page, 'Rent')).toContainText('$12,000.00');
});
