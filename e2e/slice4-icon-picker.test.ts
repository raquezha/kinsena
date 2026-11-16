import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { clearToasts, signIn } from './support/app.ts';

const OUT = '/tmp/kinsena-slice4-shots';
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
	{ name: 'mobile', width: 390, height: 844 },
	{ name: 'tablet', width: 768, height: 1024 },
	{ name: 'desktop', width: 1280, height: 900 }
] as const;

async function openNewItemSheet(page: Page): Promise<void> {
	await page.goto('/defaults');
	await page.getByRole('link', { name: /Add item/i }).click();
	await expect(page.getByRole('heading', { name: 'New saved item' })).toBeVisible();
}

test('inline icon trigger auto-detects brands and toggles collapsible picker', async ({ page }) => {
	await signIn(page);
	await page.setViewportSize({ width: 1280, height: 900 });
	await openNewItemSheet(page);
	await clearToasts(page);

	const trigger = page.getByRole('button', { name: 'Choose icon' });
	await expect(trigger).toBeVisible();
	await expect(page.locator('.grid-wrap')).toHaveCount(0);

	const name = page.getByLabel('Name');
	await name.fill('BDO');
	await expect(trigger.locator('.mono')).toHaveText('BDO', { timeout: 5_000 });

	await name.fill('Card');
	await expect(trigger.locator('.mono')).toHaveCount(0, { timeout: 5_000 });

	await trigger.click();
	const wrap = page.locator('.grid-wrap').first();
	await expect(wrap).toBeVisible();

	await page.getByRole('option', { name: 'Electric' }).click();
	await expect(page.locator('.grid-wrap')).toHaveCount(0);
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('icon picker matches Slice 4 scroll + grid at 390 / 768 / 1280', async ({ page }) => {
	await signIn(page);

	for (const viewport of VIEWPORTS) {
		await page.setViewportSize({ width: viewport.width, height: viewport.height });
		await openNewItemSheet(page);
		await clearToasts(page);

		await page.getByRole('button', { name: 'Choose icon' }).click();
		const wrap = page.locator('.grid-wrap').first();
		await expect(wrap).toBeVisible();

		const metrics = await wrap.evaluate((el) => {
			const style = getComputedStyle(el);
			const tile = Number.parseFloat(style.getPropertyValue('--tile-size'));
			const cols = Number.parseInt(style.getPropertyValue('--cols'), 10);
			const width = el.clientWidth;
			const expectedCols = Math.max(5, Math.floor((width + 8) / (44 + 8)));
			const expectedTile = (width - (expectedCols - 1) * 8) / expectedCols;
			return {
				overflowX: style.overflowX,
				overflowY: style.overflowY,
				cols,
				tile,
				expectedCols,
				expectedTile,
				mobile: el.classList.contains('mobile')
			};
		});

		expect(metrics.cols).toBe(metrics.expectedCols);
		expect(metrics.tile).toBeCloseTo(metrics.expectedTile, 1);

		if (viewport.width <= 640) {
			expect(metrics.mobile).toBe(true);
			expect(metrics.overflowX).toBe('auto');
			expect(metrics.overflowY).toBe('hidden');
		} else {
			expect(metrics.mobile).toBe(false);
			expect(metrics.overflowX).toBe('hidden');
			expect(metrics.overflowY).toBe('auto');
		}

		await page.getByLabel('Name').fill('BDO credit');
		await page.getByPlaceholder('Search icons or banks').fill('bdo');
		await expect(page.getByRole('option', { name: 'BDO', exact: true })).toBeVisible({
			timeout: 5_000
		});

		await page.screenshot({
			path: `${OUT}/${viewport.name}-defaults-icon-picker.png`,
			fullPage: false
		});
		await page.keyboard.press('Escape');
	}
});

test('destination name row shows inline brand preview', async ({ page }) => {
	await signIn(page);

	for (const viewport of VIEWPORTS) {
		await page.setViewportSize({ width: viewport.width, height: viewport.height });
		await page.goto('/defaults');
		await page.getByRole('link', { name: /Add destination/i }).click();
		await expect(page.getByRole('heading', { name: 'New destination' })).toBeVisible();
		await clearToasts(page);

		await page.getByLabel('Name').fill('GCash');
		await expect(page.locator('.badge .mono, .badge svg').first()).toBeVisible({
			timeout: 5_000
		});
		await page.screenshot({
			path: `${OUT}/${viewport.name}-defaults-dest-preview.png`,
			fullPage: false
		});
		await page.keyboard.press('Escape');
	}
});
