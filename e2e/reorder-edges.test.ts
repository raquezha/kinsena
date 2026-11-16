import { expect, test } from '@playwright/test';
import {
	addItem,
	assertVerticalDragLock,
	cancelOpenDrag,
	clearToasts,
	dragOpenItem,
	dragOpenItemTouch,
	ensureEmptyOpenList,
	openRowNames,
	performGripDrag,
	row,
	signIn
} from './support/app.ts';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
	await signIn(page);
});

test('edge: last→first, reverse twice, cancel drag, and vertical lock', async ({ page }) => {
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

	// Reverse back toward original-ish: move D after C.
	await dragOpenItem(page, 'Edge D', 'Edge C', 'after');
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Edge A', 'Edge B', 'Edge C', 'Edge D']);

	// Sideways fling must not slide the ghost left/right (vertical lock).
	await assertVerticalDragLock(page, 'Edge A', 'Edge C');
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Edge B', 'Edge C', 'Edge A', 'Edge D']);

	await page.reload();
	await expect
		.poll(async () => openRowNames(page))
		.toEqual(['Edge B', 'Edge C', 'Edge A', 'Edge D']);
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

	if (testInfo.project.name === 'desktop') {
		await dragOpenItem(page, 'Fail A', 'Fail B', 'after');
	} else {
		// Real CDP touch path — catches mobile/tablet webview quirks mouse misses.
		await dragOpenItemTouch(page, 'Fail A', 'Fail B', 'after');
	}
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Fail B', 'Fail A', 'Fail C']);

	await page.reload();
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Fail B', 'Fail A', 'Fail C']);
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

	await dragOpenItem(page, 'Swap A', 'Swap D', 'after');
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Swap B', 'Swap C', 'Swap D', 'Swap A']);

	await dragOpenItem(page, 'Swap B', 'Swap C', 'after');
	await expect
		.poll(async () => openRowNames(page), { timeout: 10_000 })
		.toEqual(['Swap C', 'Swap B', 'Swap D', 'Swap A']);

	await expect(row(page, 'Swap C').locator('.grip')).toBeVisible();
	await expect(row(page, 'Swap B').locator('.grip')).toBeVisible();
});
