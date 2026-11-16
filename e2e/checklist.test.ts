import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
	addDefault,
	addItem,
	markSalaryIn,
	nav,
	openItem,
	row,
	sheet,
	signIn
} from './support/app.ts';

async function expectNoSeriousViolations(page: Page, where: string): Promise<void> {
	const results = await new AxeBuilder({ page }).analyze();
	const serious = results.violations.filter(
		(violation) => violation.impact === 'critical' || violation.impact === 'serious'
	);
	expect(serious, where).toEqual([]);
}

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
	test.setTimeout(60_000);
	const plan = await markSalaryIn(page, '30,000', { reviewPlan: true });
	await expect(plan.getByText(/Full:|Minimum:|Skip:/).first()).toBeVisible();
	for (const scheme of ['light', 'dark'] as const) {
		await page.emulateMedia({ colorScheme: scheme });
		await expectNoSeriousViolations(page, `proposed split (${scheme})`);
	}
	const rentChoices = plan.getByRole('group', { name: 'Decision for Rent' });
	await rentChoices.getByRole('button', { name: 'Skip' }).click();
	await expect(plan.getByText('Skip: set by you')).toBeVisible();
	await rentChoices.getByRole('button', { name: 'Pay full' }).click();
	await expect(plan.getByText('Full: set by you')).toBeVisible();
	await plan.getByRole('button', { name: 'Approve all' }).click();
	await expect(plan).toBeHidden();
	await expect(page.getByRole('status')).toContainText('Plan approved');
	await expect(row(page, 'Rent')).toContainText('Full: set by you');
	await expect(page.getByRole('region', { name: 'Payday summary' })).toContainText(/remaining/i);
	await expect(
		page.getByRole('region', { name: 'Payday summary' }).getByText('Left to route')
	).toBeVisible();
	if (test.info().project.name !== 'desktop') {
		const progress = page.getByLabel('Routing progress');
		await expect(progress).toBeVisible();
		await expect(progress).toContainText(/remaining/i);
		await expect(progress).toContainText('Left to route');
	}

	await page.getByRole('button', { name: 'Mark Rent routed' }).click();
	await expect(page.getByRole('region', { name: /^Routed/ })).toContainText('Rent');
	await page.getByRole('status').getByRole('button', { name: 'Undo' }).last().click();
	await expect(page.getByRole('button', { name: 'Mark Rent routed' })).toBeVisible();

	if (!test.info().project.use.hasTouch) {
		await page.getByRole('button', { name: 'Mark Rent routed' }).click();
		await expect(page.getByRole('region', { name: /^Routed/ })).toContainText('Rent');
		await page.keyboard.press('Control+z');
		await expect(page.getByRole('button', { name: 'Mark Rent routed' })).toBeVisible();
	}

	const electricSheet = await openItem(page, 'Electricity');
	await electricSheet.getByLabel('Full amount').fill('2,450.5');
	await electricSheet.getByRole('button', { name: 'Save' }).click();
	await expect(electricSheet).toBeHidden();
	await expect(row(page, 'Electricity')).toContainText('₱2,450.50');
	await expect(page.getByRole('note')).toHaveCount(0);

	await page.reload();
	await expect(row(page, 'Electricity')).toContainText('₱2,450.50');
});

test('rejects an invalid amount without closing the editor', async ({ page }) => {
	const dialog = await openItem(page, 'Groceries');
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
	await (await openItem(page, 'Electricity')).getByRole('button', { name: 'Delete' }).click();
	await expect(row(page, 'Electricity')).toHaveCount(0);
	await page.getByRole('status').getByRole('button', { name: 'Undo' }).last().click();
	await expect(row(page, 'Electricity')).toContainText('₱2,450.50');
	await page.reload();
	await expect(row(page, 'Electricity')).toBeVisible();
});

test('finishes a payday into read-only history and reopens it', async ({ page }) => {
	test.setTimeout(60_000);
	await page.getByRole('link', { name: 'Salary, note and finish' }).click();
	const cycle = sheet(page, 'This payday');
	await cycle.getByRole('button', { name: 'Finish payday' }).click();
	const review = sheet(page, 'Before you finish');
	await expect(review).toBeVisible();
	await expect(cycle).toBeHidden();
	await expect(review.getByText('Groceries')).toBeVisible();
	await expect(review.getByRole('button', { name: 'Move to next payday' }).first()).toBeVisible();
	for (const scheme of ['light', 'dark'] as const) {
		await page.emulateMedia({ colorScheme: scheme });
		await expectNoSeriousViolations(page, `finish check (${scheme})`);
	}
	await review.getByRole('button', { name: 'Finish anyway' }).click();
	await review.getByRole('button', { name: 'Yes, finish anyway' }).click();
	await expect(review).toBeHidden();
	await nav(page, 'History').click();
	await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
	await expect(page.getByText(/^Finished /).first()).toBeVisible();
	const historyCard = page.locator('article.history-card').filter({
		has: page.getByRole('button', { name: /November 15|October 15/ })
	});
	await historyCard.getByRole('button', { name: /November 15|October 15/ }).click();
	await expect(historyCard.getByText('Rent', { exact: true })).toBeVisible();
	await historyCard.getByRole('button', { name: 'Reopen this payday' }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(
		page.getByRole('heading', { level: 1, name: /November 15|October 15/ })
	).toBeVisible();
});

test('changes the currency symbol', async ({ page }) => {
	await nav(page, 'Settings').click();
	await page.getByRole('radio', { name: /\$ USD/ }).check();
	await expect(page.getByRole('status')).toContainText('Currency updated');
	await nav(page, 'Active').click();
	await expect(row(page, 'Rent')).toContainText('$12,000.00');
});
