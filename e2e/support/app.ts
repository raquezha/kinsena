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

export function sheet(page: Page, name: string | RegExp): Locator {
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

export async function addItem(page: Page, name: string, amount = '', dueDate = ''): Promise<void> {
	const dialog = await openAddItem(page);
	await dialog.getByLabel('Name').fill(name);
	await dialog.getByLabel('Full amount').fill(amount);
	if (dueDate) await dialog.getByLabel('Due date').fill(dueDate);
	await dialog.getByRole('button', { name: 'Add item' }).click();
	await expect(dialog).toBeHidden();
	await expect(row(page, name)).toBeVisible();
}

export function row(page: Page, name: string): Locator {
	return page.getByRole('listitem').filter({ has: page.getByText(name, { exact: true }) });
}

export async function addDefault(page: Page, name: string, amount = ''): Promise<void> {
	await page.goto('/defaults');
	await page.getByRole('link', { name: 'Add item' }).click();
	const dialog = sheet(page, 'New saved item');
	await dialog.getByLabel('Name').fill(name);
	await dialog.getByLabel('Default amount').fill(amount);
	await dialog.getByRole('button', { name: 'Save item' }).click();
	await expect(dialog).toBeHidden();
	await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
}

export async function addDestination(page: Page, name: string, kind = 'Account'): Promise<void> {
	await page.goto('/defaults');
	await page.getByRole('link', { name: 'Add destination' }).click();
	const dialog = sheet(page, 'New destination');
	await dialog.getByLabel('Name').fill(name);
	await dialog.getByRole('radio', { name: kind }).check();
	await dialog.getByRole('button', { name: 'Save destination' }).click();
	await expect(dialog).toBeHidden();
}

export async function markSalaryIn(
	page: Page,
	amount = '',
	options: { reviewPlan?: boolean } = {}
): Promise<Locator> {
	await page
		.getByRole('link', { name: /Salary in/ })
		.first()
		.click();
	const dialog = sheet(page, 'Salary in');
	await expect(dialog).toBeVisible();
	if (amount) await dialog.getByLabel('Amount received').fill(amount);
	await dialog.getByRole('button', { name: 'Mark received' }).click();
	const plan = sheet(page, 'Proposed split');
	await expect(plan).toBeVisible();
	await expect(dialog).toBeHidden();
	if (!options.reviewPlan) {
		await plan.getByRole('button', { name: /^(Reject|Close)$/ }).click();
		await expect(plan).toBeHidden();
	}
	return plan;
}

export async function finishPayday(page: Page): Promise<void> {
	await page.getByRole('link', { name: 'Salary, note and finish' }).click();
	const dialog = sheet(page, 'This payday');
	await dialog.getByRole('button', { name: 'Finish payday' }).click();
	const review = sheet(page, 'Before you finish');
	const confirm = dialog.getByRole('button', { name: 'Yes, finish it' });
	await expect(review.or(confirm)).toBeVisible();
	if (await review.isVisible()) {
		await review.getByRole('button', { name: 'Finish anyway' }).click();
		await review.getByRole('button', { name: 'Yes, finish anyway' }).click();
		await expect(review).toBeHidden();
		return;
	}
	await confirm.click();
	await expect(dialog).toBeHidden();
}

export async function clearToasts(page: Page): Promise<void> {
	await page
		.evaluate(() => {
			document.querySelectorAll('.toaster button.dismiss').forEach((button) => {
				(button as HTMLButtonElement).click();
			});
		})
		.catch(() => undefined);
}
