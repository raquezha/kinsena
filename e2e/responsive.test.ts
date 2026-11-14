import { expect, test } from '@playwright/test';
import { signIn, startCycle } from './support/app.ts';

test('uses the navigation and editor style that fits the viewport', async ({ page }, info) => {
	await signIn(page);
	if (await page.getByRole('heading', { name: 'Start a payday' }).isVisible()) {
		await startCycle(page, `Layout ${info.project.name}`);
	}
	const navBox = await page.getByRole('navigation', { name: 'Main' }).boundingBox();
	const viewport = page.viewportSize();
	if (!navBox || !viewport) throw new Error('missing layout boxes');

	await page.keyboard.press('n');
	const panel = page.getByRole('dialog', { name: 'Add an item' }).locator('.panel');
	await expect(panel).toBeVisible();
	await page.waitForTimeout(600);
	const panelBox = await panel.boundingBox();
	if (!panelBox) throw new Error('missing panel box');

	if (info.project.name === 'mobile') {
		expect(navBox.y + navBox.height).toBeCloseTo(viewport.height, 0);
		expect(panelBox.y + panelBox.height).toBeCloseTo(viewport.height, 0);
	} else if (info.project.name === 'tablet') {
		expect(navBox.width).toBeLessThan(120);
		const center = panelBox.x + panelBox.width / 2;
		expect(Math.abs(center - viewport.width / 2)).toBeLessThan(2);
	} else {
		expect(navBox.width).toBeGreaterThan(180);
		// Side panel: docked to the right edge (it floats with a small gutter).
		expect(viewport.width - (panelBox.x + panelBox.width)).toBeLessThan(24);
		expect(panelBox.height).toBeGreaterThan(viewport.height * 0.8);
	}
	await page.keyboard.press('Escape');
	await expect(panel).toBeHidden();
});
