import { expect, type Locator, type Page } from '@playwright/test';
import { E2E_PASSPHRASE } from './constants.ts';

export async function signIn(page: Page): Promise<void> {
	await page.goto('/login');
	await page.getByLabel('Passphrase').fill(E2E_PASSPHRASE);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/$/);
}

export function nav(page: Page, name: string): Locator {
	return page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name, exact: true });
}

export function sheet(page: Page, name: string): Locator {
	return page.getByRole('dialog', { name });
}

export async function openAddItem(page: Page): Promise<Locator> {
	await page
		.getByRole('link', { name: /^Add (an )?item/ })
		.filter({ visible: true })
		.first()
		.click();
	const dialog = sheet(page, 'Add an item');
	await expect(dialog).toBeVisible();
	return dialog;
}

export async function addItem(page: Page, name: string, amount = ''): Promise<void> {
	const dialog = await openAddItem(page);
	await dialog.getByLabel('Name').fill(name);
	await dialog.getByLabel('Amount').fill(amount);
	await dialog.getByRole('button', { name: 'Add item' }).click();
	await expect(dialog).toBeHidden();
	await expect(row(page, name)).toBeVisible();
}

export function row(page: Page, name: string): Locator {
	return page.locator('.row').filter({ has: page.getByText(name, { exact: true }) });
}

export async function addDefault(page: Page, name: string, amount = ''): Promise<void> {
	await page.goto('/defaults');
	await page.getByRole('link', { name: 'Add' }).click();
	const dialog = sheet(page, 'New saved item');
	await dialog.getByLabel('Name').fill(name);
	await dialog.getByLabel('Default amount').fill(amount);
	await dialog.getByRole('button', { name: 'Save item' }).click();
	await expect(dialog).toBeHidden();
	await expect(page.getByText(name, { exact: true })).toBeVisible();
}

export async function startCycle(page: Page, title: string, salary = ''): Promise<void> {
	await page.goto('/');
	await page.getByLabel('Title').fill(title);
	await page.getByLabel(/^Salary/).fill(salary);
	await page.getByRole('button', { name: 'Start cycle' }).click();
	await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
}

export async function finishCycle(page: Page): Promise<void> {
	await page.getByRole('link', { name: 'Salary, note and finish' }).click();
	const dialog = sheet(page, 'This payday');
	await dialog.getByRole('button', { name: 'Finish payday cycle' }).click();
	await dialog.getByRole('button', { name: 'Yes, finish it' }).click();
	await expect(page.getByRole('heading', { name: 'Start a payday' })).toBeVisible();
}
