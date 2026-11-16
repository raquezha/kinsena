// Visual + motion parity: XY grip drag frames (no invisible slot, smooth ghost).
// Run with: npx playwright test e2e/reorder-shots.test.ts --project=reorder-shots
import { expect, test, type Page } from '@playwright/test';
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

type Point = { x: number; y: number };

async function gripCenter(page: Page, name: string): Promise<Point> {
	const grip = row(page, name).locator('.grip');
	await grip.scrollIntoViewIfNeeded();
	const box = await grip.boundingBox();
	if (!box) throw new Error(`missing grip for ${name}`);
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function assertMidDragHealthy(page: Page, pointer: Point): Promise<void> {
	const ghost = page.locator('#dnd-action-dragged-el');
	await expect(ghost).toBeVisible({ timeout: 5_000 });
	await expect(ghost).toHaveClass(new RegExp(DRAG_GHOST_CLASS));
	const ghostBox = await ghost.boundingBox();
	expect(ghostBox).toBeTruthy();
	const gx = (ghostBox?.x ?? 0) + (ghostBox?.width ?? 0) / 2;
	const gy = (ghostBox?.y ?? 0) + (ghostBox?.height ?? 0) / 2;
	// Butter-smooth: ghost stays glued to the pointer on both axes (no vertical lock).
	expect(Math.abs(gx - pointer.x)).toBeLessThanOrEqual(64);
	expect(Math.abs(gy - pointer.y)).toBeLessThanOrEqual(64);
	const heights = await ghost.evaluate((el) => {
		const card = el.querySelector('.swipe') as HTMLElement | null;
		return {
			ghost: el.getBoundingClientRect().height,
			card: card?.getBoundingClientRect().height ?? 0
		};
	});
	expect(heights.card).toBeGreaterThan(0);
	expect(Math.abs(heights.ghost - heights.card)).toBeLessThanOrEqual(8);

	const list = page.getByRole('list', { name: /^(Planned|To route)$/ });
	const mid = await list.evaluate((el) => {
		const contentBottom = Array.from(el.children).reduce((max, child) => {
			const box = (child as HTMLElement).getBoundingClientRect();
			return Math.max(max, box.bottom);
		}, el.getBoundingClientRect().top);
		const shadow = el.querySelector(
			'[data-is-dnd-shadow-item-internal="true"]'
		) as HTMLElement | null;
		const style = shadow ? getComputedStyle(shadow) : null;
		const decisions = shadow?.querySelector('.decisions') as HTMLElement | null;
		return {
			emptyBandPx: el.getBoundingClientRect().bottom - contentBottom,
			inlineMinHeight: el.style.minHeight || '',
			shadowVisibility: style?.visibility ?? 'missing',
			shadowBg: style?.backgroundColor ?? '',
			decisionsDisplay: decisions ? getComputedStyle(decisions).display : 'none'
		};
	});
	expect(mid.inlineMinHeight).toBe('');
	expect(mid.emptyBandPx).toBeLessThanOrEqual(24);
	expect(mid.shadowVisibility).toBe('visible');
	expect(mid.shadowBg).not.toMatch(/^rgba?\(0,\s*0,\s*0,\s*0\)$/);
	expect(mid.decisionsDisplay).toBe('none');
}

/**
 * Drag Alpha through right → down → left → up waypoints; screenshot + assert each frame.
 */
async function dragXyFramePass(page: Page, layout: string): Promise<void> {
	const start = await gripCenter(page, 'Shot Alpha');
	const beta = await gripCenter(page, 'Shot Beta');
	const gamma = await gripCenter(page, 'Shot Gamma');

	const frames: { label: string; point: Point }[] = [
		{ label: 'right', point: { x: start.x + Math.max(80, beta.x - start.x), y: start.y } },
		{ label: 'down', point: { x: gamma.x, y: gamma.y } },
		{ label: 'left', point: { x: Math.min(start.x, beta.x) - 20, y: gamma.y } },
		{ label: 'up', point: { x: start.x + 24, y: start.y + 36 } }
	];

	await page.mouse.move(start.x, start.y);
	await page.mouse.down();
	await page.waitForTimeout(80);
	// Cross the drag threshold before asserting — ghost does not exist on a pure press.
	await page.mouse.move(start.x + 12, start.y + 12, { steps: 4 });
	await expect(page.locator('#dnd-action-dragged-el')).toBeVisible({ timeout: 5_000 });

	for (const frame of frames) {
		await page.mouse.move(frame.point.x, frame.point.y, { steps: 14 });
		await assertMidDragHealthy(page, frame.point);
		await page.screenshot({
			path: `${OUT}/${layout}-reorder-${frame.label}.png`,
			animations: 'disabled'
		});
	}

	// Drop below Gamma so the shadow settles at the end (order must change).
	await page.mouse.move(gamma.x, gamma.y + 72, { steps: 10 });
	await assertMidDragHealthy(page, { x: gamma.x, y: gamma.y + 72 });
	await page.screenshot({
		path: `${OUT}/${layout}-reorder-drop.png`,
		animations: 'disabled'
	});
	const reorder = page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('?/reorder') &&
			response.ok(),
		{ timeout: 15_000 }
	);
	await page.mouse.up();
	await reorder;
	await expect(page.locator('#dnd-action-dragged-el')).toHaveCount(0);
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.not.toEqual(['Shot Alpha', 'Shot Beta', 'Shot Gamma']);
}

test('captures XY drag frames with visible highlight and no empty band', async ({ page }) => {
	test.setTimeout(240_000);
	mkdirSync(OUT, { recursive: true });

	await page.setViewportSize(LAYOUTS[0]);
	await signIn(page);
	await ensureEmptyOpenList(page);
	await addItem(page, 'Shot Alpha', '100');
	await addItem(page, 'Shot Beta', '200');
	await addItem(page, 'Shot Gamma', '300');
	await expect.poll(async () => openRowNames(page)).toContain('Shot Alpha');
	await clearToasts(page);

	const planned = page.getByRole('list', { name: /^(Planned|To route)$/ });

	for (const layout of LAYOUTS) {
		await page.setViewportSize(layout);
		await page.goto('/');
		await expect(row(page, 'Shot Alpha')).toBeVisible();
		await clearToasts(page);
		await planned.scrollIntoViewIfNeeded();
		await planned.screenshot({
			path: `${OUT}/${layout.name}-reorder-idle.png`,
			animations: 'disabled'
		});
		await dragXyFramePass(page, layout.name);
	}
});
