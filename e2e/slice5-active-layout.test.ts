import { expect, test } from '@playwright/test';
import { clearToasts, signIn } from './support/app.ts';

const OUT = 'docs/screenshots';

const VIEWPORTS = [
	{ name: 'mobile', width: 390, height: 844, cols: 1 },
	{ name: 'tablet', width: 768, height: 1024, cols: 2 },
	{ name: 'desktop', width: 1280, height: 900, cols: 3 }
] as const;

test('Active hero is full-width above Planned; Add item has collapsible icon picker', async ({
	page
}) => {
	await signIn(page);

	for (const viewport of VIEWPORTS) {
		await page.setViewportSize({ width: viewport.width, height: viewport.height });
		await page.goto('/');
		await clearToasts(page);

		const wallet = page.getByRole('region', { name: 'Payday summary' });
		await expect(wallet).toBeVisible();
		await expect(
			page.getByText(/Expected salary|Left to route|Kept in full/i).first()
		).toBeVisible();

		const layout = await page.evaluate(() => {
			const header = document.querySelector('.cycle-header');
			const summary = document.querySelector('[aria-label="Payday summary"]');
			const active = document.querySelector('.active');
			if (!header || !summary || !active) return null;
			const hr = header.getBoundingClientRect();
			const sr = summary.getBoundingClientRect();
			const ar = active.getBoundingClientRect();
			const style = getComputedStyle(active);
			return {
				headerThenSummary: hr.bottom <= sr.top + 4,
				noSidebarColumns: style.gridTemplateColumns.split(' ').length === 1,
				summaryNearFull: sr.width / ar.width > 0.85
			};
		});
		expect(layout?.headerThenSummary).toBe(true);
		expect(layout?.noSidebarColumns).toBe(true);
		expect(layout?.summaryNearFull).toBe(true);

		const addLink = page
			.getByRole('link', { name: /Add item/i })
			.or(page.getByRole('link', { name: 'Add an item' }));
		await addLink.first().click();
		await expect(page.getByRole('heading', { name: 'Add an item' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Choose icon' })).toBeVisible();
		await expect(page.locator('.grid-wrap')).toHaveCount(0);

		await page.getByLabel('Name').fill('BDO');
		await expect(page.getByRole('button', { name: 'Choose icon' }).locator('.mono')).toHaveText(
			'BDO',
			{ timeout: 5_000 }
		);

		await page.getByRole('button', { name: 'Choose icon' }).click();
		const wrap = page.locator('.grid-wrap').first();
		await expect(wrap).toBeVisible();
		const overflow = await wrap.evaluate((el) => {
			const style = getComputedStyle(el);
			return { x: style.overflowX, y: style.overflowY };
		});
		if (viewport.width <= 640) {
			expect(overflow.x).toBe('auto');
			expect(overflow.y).toBe('hidden');
		} else {
			expect(overflow.x).toBe('hidden');
			expect(overflow.y).toBe('auto');
		}

		await page.screenshot({
			path: `${OUT}/${viewport.name}-active-slice5.png`,
			fullPage: false
		});
		await page.keyboard.press('Escape');
	}
});
