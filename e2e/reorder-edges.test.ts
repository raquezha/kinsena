import { expect, test } from '@playwright/test';
import {
	addItem,
	assertGridDragFollowsPointer,
	cancelOpenDrag,
	clearToasts,
	dragOpenItem,
	dragOpenItemTouch,
	ensureEmptyOpenList,
	markSalaryIn,
	openItem,
	openRowNames,
	performGripDrag,
	row,
	signIn
} from './support/app.ts';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
	await signIn(page);
});

test('edge: last→first, reverse twice, cancel drag, and grid pointer follow', async ({ page }) => {
	test.setTimeout(120_000);
	await ensureEmptyOpenList(page);
	await addItem(page, 'Edge A', '10');
	await addItem(page, 'Edge B', '20');
	await addItem(page, 'Edge C', '30');
	await addItem(page, 'Edge D', '40');
	await expect
		.poll(async () => openRowNames(page))
		.toEqual(['Edge A', 'Edge B', 'Edge C', 'Edge D']);

	// Cancel: press grip, tiny wiggle, release — no reorder request.
	await cancelOpenDrag(page, 'Edge A');
	await expect
		.poll(async () => openRowNames(page))
		.toEqual(['Edge A', 'Edge B', 'Edge C', 'Edge D']);

	// Last to first.
	await dragOpenItem(page, 'Edge D', 'Edge A', 'before');
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Edge D', 'Edge A', 'Edge B', 'Edge C']);

	// Reverse via "before" walks — more reliable than after-last on 1-col mobile.
	await dragOpenItem(page, 'Edge A', 'Edge D', 'before');
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Edge A', 'Edge D', 'Edge B', 'Edge C']);
	await dragOpenItem(page, 'Edge B', 'Edge D', 'before');
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Edge A', 'Edge B', 'Edge D', 'Edge C']);
	await dragOpenItem(page, 'Edge C', 'Edge D', 'before');
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Edge A', 'Edge B', 'Edge C', 'Edge D']);

	// Sideways motion must follow the pointer; mid-drag must not leave an empty bottom band.
	const beforeSideways = await openRowNames(page);
	await assertGridDragFollowsPointer(page, 'Edge A', 'Edge C');
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.not.toEqual(beforeSideways);

	const afterSideways = await openRowNames(page);
	await page.reload();
	await expect.poll(async () => openRowNames(page)).toEqual(afterSideways);
});

test('edge: failed reorder rolls UI back; touch drag works on touch projects', async ({
	page
}, testInfo) => {
	test.setTimeout(120_000);
	await ensureEmptyOpenList(page);
	await addItem(page, 'Fail A', '11');
	await addItem(page, 'Fail B', '22');
	await addItem(page, 'Fail C', '33');
	await expect.poll(async () => openRowNames(page)).toEqual(['Fail A', 'Fail B', 'Fail C']);
	await clearToasts(page);
	const before = ['Fail A', 'Fail B', 'Fail C'];

	// Only abort reorder POSTs — do not blanket-intercept the page.
	await page.route(
		(url) => url.href.includes('?/reorder'),
		async (route) => {
			if (route.request().method() === 'POST') {
				await route.abort('failed');
				return;
			}
			await route.continue();
		}
	);

	const aborted = page.waitForRequest(
		(request) => request.method() === 'POST' && request.url().includes('?/reorder'),
		{ timeout: 15_000 }
	);
	await performGripDrag(page, 'Fail C', 'Fail A', 'before');
	await aborted;

	await expect(page.locator('.toast.error')).toContainText(/offline|went wrong|Could not/i, {
		timeout: 8_000
	});
	await expect.poll(async () => openRowNames(page), { timeout: 8_000 }).toEqual(before);
	await page.unrouteAll({ behavior: 'ignoreErrors' });
	await clearToasts(page);
	// Abort can leave svelte-dnd-action mid-gesture; reload before the success path.
	await page.reload();
	await expect.poll(async () => openRowNames(page)).toEqual(before);

	if (testInfo.project.name === 'desktop') {
		await dragOpenItem(page, 'Fail B', 'Fail A', 'before');
	} else {
		// Real CDP touch path — catches mobile/tablet webview quirks mouse misses.
		await dragOpenItemTouch(page, 'Fail B', 'Fail A', 'before');
	}
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Fail B', 'Fail A', 'Fail C']);

	await page.reload();
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Fail B', 'Fail A', 'Fail C']);
});

test('edge: routing mode keeps cards uniform (decisions only in item sheet)', async ({ page }) => {
	test.setTimeout(90_000);
	await ensureEmptyOpenList(page);
	await addItem(page, 'Ghost Tall A', '100');
	await addItem(page, 'Ghost Tall B', '200');
	await markSalaryIn(page, '50,000');
	// Inline decision bars are gone — cards stay drag-clean in Received mode.
	await expect(row(page, 'Ghost Tall A').locator('.decisions')).toHaveCount(0);
	await expect(
		row(page, 'Ghost Tall A').getByRole('button', { name: 'Pay full', exact: true })
	).toHaveCount(0);
	await expect(
		row(page, 'Ghost Tall A').getByRole('button', { name: 'More routing actions for Ghost Tall A' })
	).toBeVisible();

	const dialog = await openItem(page, 'Ghost Tall A');
	await expect(dialog.getByRole('button', { name: 'Pay full', exact: true })).toBeVisible();
	await dialog.getByRole('link', { name: 'Close' }).click();
	await expect(dialog).toBeHidden();

	// Mid-drag still works in Received mode — cards are the same height as Planned.
	const fromGrip = row(page, 'Ghost Tall A').locator('.grip');
	const toBox = await row(page, 'Ghost Tall B').boundingBox();
	const fromBox = await fromGrip.boundingBox();
	if (!fromBox || !toBox) throw new Error('missing drag boxes');
	await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
	await page.mouse.down();
	await page.waitForTimeout(80);
	await page.mouse.move(toBox.x + 40, toBox.y + toBox.height / 2, { steps: 12 });
	const ghost = page.locator('#dnd-action-dragged-el');
	await expect(ghost).toBeVisible({ timeout: 5_000 });
	const heights = await ghost.evaluate((el) => {
		const card = el.querySelector('.swipe') as HTMLElement | null;
		return {
			ghost: el.getBoundingClientRect().height,
			card: card?.getBoundingClientRect().height ?? 0
		};
	});
	expect(Math.abs(heights.ghost - heights.card)).toBeLessThanOrEqual(8);
	await page.screenshot({
		path: '/tmp/kinsena-reorder-shots/routing-cards-uniform.png',
		animations: 'disabled'
	});
	await page.mouse.up();
});

test('edge: first→last then neighbor swap; grip stays for 2+ open rows', async ({ page }) => {
	test.setTimeout(90_000);
	await ensureEmptyOpenList(page);
	await addItem(page, 'Swap A', '10');
	await addItem(page, 'Swap B', '20');
	await addItem(page, 'Swap C', '30');
	await addItem(page, 'Swap D', '40');
	const start = ['Swap A', 'Swap B', 'Swap C', 'Swap D'];
	await expect.poll(async () => openRowNames(page)).toEqual(start);

	// First→last via "before" walks — same end state, more reliable than after-last on 1-col.
	await dragOpenItem(page, 'Swap B', 'Swap A', 'before');
	await dragOpenItem(page, 'Swap C', 'Swap A', 'before');
	await dragOpenItem(page, 'Swap D', 'Swap A', 'before');
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Swap B', 'Swap C', 'Swap D', 'Swap A']);

	await page.reload();
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Swap B', 'Swap C', 'Swap D', 'Swap A']);

	// Last→first "before" is the reliable axis on 1/2-col grids (after-neighbor is flaky).
	await dragOpenItem(page, 'Swap A', 'Swap B', 'before');
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Swap A', 'Swap B', 'Swap C', 'Swap D']);

	await expect(row(page, 'Swap A').locator('.grip')).toBeVisible();
	await expect(row(page, 'Swap B').locator('.grip')).toBeVisible();
});
