import { expect, test, type Page } from '@playwright/test';
import {
	addItem,
	dragOpenItem,
	ensureEmptyOpenList,
	markSalaryIn,
	openRowBoxes,
	openRowNames,
	row,
	sheet,
	signIn
} from './support/app.ts';

async function skipViaMoreMenu(page: Page, name: string) {
	const item = row(page, name);
	await item.getByRole('button', { name: `More routing actions for ${name}` }).click();
	await item.getByRole('menuitem', { name: 'Skip' }).click();
	const skipSheet = sheet(page, new RegExp(`Skip ${name}`));
	await expect(skipSheet).toBeVisible();
	await skipSheet.getByRole('button', { name: 'Skip this payday' }).click();
	await expect(skipSheet).toBeHidden();
}

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
	await signIn(page);
});

test('grip drag persists after drop and reload without expanding rows', async ({ page }) => {
	test.setTimeout(90_000);
	await ensureEmptyOpenList(page);
	await addItem(page, 'Reorder Alpha', '100');
	await addItem(page, 'Reorder Beta', '200');
	await addItem(page, 'Reorder Gamma', '300');

	await expect(page.getByText('Drag the handle to reorder across the grid.')).toBeVisible();
	await expect
		.poll(async () => openRowNames(page))
		.toEqual(['Reorder Alpha', 'Reorder Beta', 'Reorder Gamma']);

	const before = await openRowBoxes(page);
	expect(before).toHaveLength(3);
	const beforeByName = Object.fromEntries(before.map((entry) => [entry.name, entry]));

	await dragOpenItem(page, 'Reorder Alpha', 'Reorder Gamma');

	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Reorder Beta', 'Reorder Gamma', 'Reorder Alpha']);

	// Layout must settle without growing (grip column must stay reserved during save).
	await expect
		.poll(
			async () => {
				const after = await openRowBoxes(page);
				return after.every((entry) => {
					const prior = beforeByName[entry.name];
					if (!prior) return false;
					return (
						Math.abs(entry.width - prior.width) <= 2 && Math.abs(entry.height - prior.height) <= 2
					);
				});
			},
			{ timeout: 10_000 }
		)
		.toBe(true);

	await page.reload();
	await expect
		.poll(async () => openRowNames(page))
		.toEqual(['Reorder Beta', 'Reorder Gamma', 'Reorder Alpha']);

	const reloaded = await openRowBoxes(page);
	for (const entry of reloaded) {
		const prior = beforeByName[entry.name];
		expect(prior).toBeTruthy();
		expect(Math.abs(entry.width - prior!.width)).toBeLessThanOrEqual(2);
		expect(Math.abs(entry.height - prior!.height)).toBeLessThanOrEqual(2);
	}
});

test('skipped items leave the open list; single open row has no grip', async ({ page }) => {
	test.setTimeout(90_000);
	await markSalaryIn(page, '50,000');

	await skipViaMoreMenu(page, 'Reorder Beta');
	await expect(page.getByRole('region', { name: /^Skipped/ })).toContainText('Reorder Beta');
	await expect.poll(async () => openRowNames(page)).toEqual(['Reorder Gamma', 'Reorder Alpha']);
	await expect(row(page, 'Reorder Gamma').locator('.grip')).toBeVisible();

	await skipViaMoreMenu(page, 'Reorder Gamma');

	await expect.poll(async () => openRowNames(page)).toEqual(['Reorder Alpha']);
	await expect(row(page, 'Reorder Alpha').locator('.grip')).toHaveCount(0);
	await expect(page.getByText('Drag the handle to reorder across the grid.')).toHaveCount(0);
	await expect(page.getByRole('region', { name: /^Skipped/ })).toContainText('Reorder Beta');
	await expect(page.getByRole('region', { name: /^Skipped/ })).toContainText('Reorder Gamma');

	await page.reload();
	await expect.poll(async () => openRowNames(page)).toEqual(['Reorder Alpha']);
	await expect(row(page, 'Reorder Alpha').locator('.grip')).toHaveCount(0);
});
