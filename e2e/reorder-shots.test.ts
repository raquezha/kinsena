// Visual parity: grip drag on checklist rows (idle + real mid-drag ghost).
// Run with: npx playwright test e2e/reorder-shots.test.ts --project=screenshots
import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import {
	addItem,
	clearToasts,
	ensureEmptyOpenList,
	openRowNames,
	row,
	signIn
} from './support/app.ts';
import { DRAG_GHOST_CLASS } from '../src/lib/client/checklist-dnd.ts';

const OUT = '/tmp/kinsena-reorder-shots';
const LAYOUTS = [
	{ name: 'mobile', width: 390, height: 844 },
	{ name: 'tablet', width: 834, height: 1112 },
	{ name: 'desktop', width: 1440, height: 900 }
] as const;

/** Hold a real grip drag mid-flight so #dnd-action-dragged-el exists for screenshots. */
async function holdDragFromAlpha(page: import('@playwright/test').Page): Promise<void> {
	const fromGrip = row(page, 'Shot Alpha').locator('.grip');
	const toRow = row(page, 'Shot Gamma');
	await fromGrip.scrollIntoViewIfNeeded();
	await toRow.scrollIntoViewIfNeeded();
	const fromBox = await fromGrip.boundingBox();
	const toBox = await toRow.boundingBox();
	if (!fromBox || !toBox) throw new Error('missing drag boxes');
	const startX = fromBox.x + fromBox.width / 2;
	const startY = fromBox.y + fromBox.height / 2;
	const endX = toBox.x + Math.min(48, toBox.width / 2);
	const endY = toBox.y + toBox.height / 2;
	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.waitForTimeout(80);
	await page.mouse.move(endX, (startY + endY) / 2, { steps: 12 });
	await expect(page.locator(`#dnd-action-dragged-el.${DRAG_GHOST_CLASS}`)).toBeVisible({
		timeout: 5_000
	});
}

test('captures grip idle and real mid-drag states', async ({ page }) => {
	test.setTimeout(180_000);
	mkdirSync(OUT, { recursive: true });

	await page.setViewportSize(LAYOUTS[0]);
	await signIn(page);
	await ensureEmptyOpenList(page);
	await addItem(page, 'Shot Alpha', '100');
	await addItem(page, 'Shot Beta', '200');
	await addItem(page, 'Shot Gamma', '300');
	await expect.poll(async () => openRowNames(page)).toContain('Shot Alpha');
	await clearToasts(page);
	await page.evaluate(() => window.scrollTo(0, 0));

	const planned = page.getByRole('list', { name: /^(Planned|To route)$/ });
	await expect(page.getByText('Drag the handle to reorder.')).toBeVisible();
	await expect(row(page, 'Shot Alpha').locator('.grip')).toBeVisible();
	await planned.scrollIntoViewIfNeeded();
	await planned.screenshot({ path: `${OUT}/mobile-reorder-idle.png`, animations: 'disabled' });

	await holdDragFromAlpha(page);
	await page.screenshot({ path: `${OUT}/mobile-reorder-dragging.png`, animations: 'disabled' });
	await page.mouse.up();
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.not.toEqual(['Shot Alpha', 'Shot Beta', 'Shot Gamma']);

	await page.setViewportSize(LAYOUTS[1]);
	await page.goto('/');
	await expect(row(page, 'Shot Alpha')).toBeVisible();
	await clearToasts(page);
	await planned.scrollIntoViewIfNeeded();
	await planned.screenshot({ path: `${OUT}/tablet-reorder-idle.png`, animations: 'disabled' });

	await holdDragFromAlpha(page);
	await page.screenshot({ path: `${OUT}/tablet-reorder-dragging.png`, animations: 'disabled' });
	await page.mouse.up();

	await page.setViewportSize(LAYOUTS[2]);
	await page.goto('/');
	await expect(row(page, 'Shot Alpha')).toBeVisible();
	await clearToasts(page);
	await expect(page.getByText('Drag the handle to reorder.')).toBeVisible();
	await planned.scrollIntoViewIfNeeded();
	await planned.screenshot({ path: `${OUT}/desktop-reorder-idle.png`, animations: 'disabled' });

	await holdDragFromAlpha(page);
	await page.screenshot({ path: `${OUT}/desktop-reorder-dragging.png`, animations: 'disabled' });
	await page.mouse.up();
});
