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

/** Opens the item editor sheet (card has both Edit and Open links). */
export async function openItem(page: Page, name: string): Promise<Locator> {
	await row(page, name).getByRole('link', { name: `Edit ${name}` }).click();
	const dialog = sheet(page, name);
	await expect(dialog).toBeVisible();
	return dialog;
}

export async function addDefault(page: Page, name: string, amount = ''): Promise<void> {
	await page.goto('/defaults');
	await page.getByRole('link', { name: 'Add item' }).click();
	const dialog = sheet(page, 'New saved item');
	await dialog.getByLabel('Name').fill(name);
	await dialog.getByRole('textbox', { name: /^Default amount/ }).fill(amount);
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

/** Open-list names in visual order under Planned / To route. */
export async function openRowNames(page: Page): Promise<string[]> {
	const region = page.getByRole('list', { name: /^(Planned|To route)$/ });
	return region
		.locator(':scope > li')
		.evaluateAll((nodes) =>
			nodes.map((node) => node.getAttribute('aria-label') ?? '').filter(Boolean)
		);
}

/** Open-list names whose label matches `prefix` (shared e2e DB isolation). */
export async function openRowNamesPrefixed(page: Page, prefix: string): Promise<string[]> {
	return (await openRowNames(page)).filter((name) => name.startsWith(prefix));
}

/**
 * Leave an unpaid payday with an empty open list for the next suite.
 * Finish a Received payday first (so Salary in returns), then delete any
 * defaults that copied onto the next payday.
 */
export async function ensureEmptyOpenList(page: Page): Promise<void> {
	await expect(page.getByRole('main')).toBeVisible();
	// Wait for checklist hydrate (empty copy or Planned/To route list).
	await expect(
		page.getByRole('list', { name: /^(Planned|To route)$/ }).or(page.locator('.checklist .empty'))
	).toBeVisible({ timeout: 10_000 });

	const salaryIn = page.getByRole('link', { name: /Salary in/ }).first();
	if (!(await salaryIn.isVisible())) {
		await finishPayday(page);
	}

	for (;;) {
		const names = await openRowNames(page);
		if (names.length === 0) break;
		const name = names[0]!;
		const dialog = await openItem(page, name);
		await dialog.getByRole('button', { name: 'Delete' }).click();
		await expect(dialog).toBeHidden();
		await expect.poll(async () => openRowNames(page), { timeout: 10_000 }).not.toContain(name);
	}
	await clearToasts(page);
}

/** Open-list row boxes (width/height) for layout-stability asserts after reorder. */
export async function openRowBoxes(
	page: Page
): Promise<Array<{ name: string; width: number; height: number }>> {
	const region = page.getByRole('list', { name: /^(Planned|To route)$/ });
	return region.locator(':scope > li').evaluateAll((nodes) =>
		nodes.map((node) => {
			const rect = (node as HTMLElement).getBoundingClientRect();
			return {
				name: node.getAttribute('aria-label') ?? '',
				width: Math.round(rect.width),
				height: Math.round(rect.height)
			};
		})
	);
}

async function gripDragBoxes(
	page: Page,
	fromName: string,
	toName: string,
	place: 'before' | 'after'
) {
	const fromGrip = row(page, fromName).locator('.grip');
	const toRow = row(page, toName);
	await expect(fromGrip).toBeVisible();
	await fromGrip.scrollIntoViewIfNeeded();
	await toRow.scrollIntoViewIfNeeded();
	const fromBox = await fromGrip.boundingBox();
	const toBox = await toRow.boundingBox();
	if (!fromBox || !toBox) throw new Error('missing drag boxes');
	return {
		fromGrip,
		start: { x: fromBox.x + fromBox.width / 2, y: fromBox.y + fromBox.height / 2 },
		end: {
			x: toBox.x + Math.min(48, toBox.width / 2),
			y: place === 'after' ? toBox.y + toBox.height - 6 : toBox.y + 6
		},
		listLeft: (await page.getByRole('list', { name: /^(Planned|To route)$/ }).boundingBox())?.x ?? 0
	};
}

/** Pointer grip drag only (no network wait) — used for success and failure paths. */
export async function performGripDrag(
	page: Page,
	fromName: string,
	toName: string,
	place: 'before' | 'after' = 'after'
): Promise<void> {
	const { start, end } = await gripDragBoxes(page, fromName, toName, place);
	await page.mouse.move(start.x, start.y);
	await page.mouse.down();
	await page.waitForTimeout(80);
	await page.mouse.move(end.x, (start.y + end.y) / 2, { steps: 16 });
	await page.mouse.move(end.x, end.y, { steps: 16 });
	await page.mouse.up();
}

/**
 * Drag by grip handle (svelte-dnd-action ignores Playwright dragTo).
 * `place` = drop above or below the target row midpoint.
 * Waits for `?/reorder` so finalize persisted (not only local consider state).
 */
export async function dragOpenItem(
	page: Page,
	fromName: string,
	toName: string,
	place: 'before' | 'after' = 'after'
): Promise<void> {
	const reorder = page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('?/reorder') &&
			response.ok(),
		{ timeout: 15_000 }
	);
	await performGripDrag(page, fromName, toName, place);
	await reorder;
}

/** Press grip then release with almost no travel — must not POST reorder. */
export async function cancelOpenDrag(page: Page, name: string): Promise<void> {
	const grip = row(page, name).locator('.grip');
	await expect(grip).toBeVisible();
	await grip.scrollIntoViewIfNeeded();
	const box = await grip.boundingBox();
	if (!box) throw new Error('missing grip box');
	const x = box.x + box.width / 2;
	const y = box.y + box.height / 2;
	const leaked = page
		.waitForRequest(
			(request) => request.method() === 'POST' && request.url().includes('?/reorder'),
			{ timeout: 800 }
		)
		.then(() => true)
		.catch(() => false);
	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.waitForTimeout(60);
	await page.mouse.move(x + 2, y + 2, { steps: 2 });
	await page.mouse.up();
	expect(await leaked).toBe(false);
}

/**
 * Mid-drag: ghost must stay vertically locked (no left/right jump).
 * Drifts sideways with the pointer on X, then asserts the ghost X stays near the list.
 */
export async function assertVerticalDragLock(
	page: Page,
	fromName: string,
	toName: string
): Promise<void> {
	const { start, end, listLeft } = await gripDragBoxes(page, fromName, toName, 'after');
	await page.mouse.move(start.x, start.y);
	await page.mouse.down();
	await page.waitForTimeout(80);
	// Pull far sideways on purpose — vertical lock should zero X translate.
	await page.mouse.move(start.x + 120, (start.y + end.y) / 2, { steps: 10 });
	const ghost = page.locator('#dnd-action-dragged-el');
	await expect(ghost).toBeVisible({ timeout: 5_000 });
	const ghostBox = await ghost.boundingBox();
	expect(ghostBox).toBeTruthy();
	expect(Math.abs((ghostBox?.x ?? 0) - listLeft)).toBeLessThanOrEqual(28);
	await page.mouse.move(end.x, end.y, { steps: 10 });
	await page.mouse.up();
	await page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('?/reorder') &&
			response.ok(),
		{ timeout: 15_000 }
	);
}

/**
 * Touch drag via CDP (synthetic PointerEvents on the grip are ignored by
 * svelte-dnd-action; real touch points are what mobile/tablet need).
 */
export async function dragOpenItemTouch(
	page: Page,
	fromName: string,
	toName: string,
	place: 'before' | 'after' = 'after'
): Promise<void> {
	const { start, end } = await gripDragBoxes(page, fromName, toName, place);
	const reorder = page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('?/reorder') &&
			response.ok(),
		{ timeout: 15_000 }
	);
	const session = await page.context().newCDPSession(page);
	const finger = (x: number, y: number) => [{ x: Math.round(x), y: Math.round(y) }];
	await session.send('Input.dispatchTouchEvent', {
		type: 'touchStart',
		touchPoints: finger(start.x, start.y)
	});
	await page.waitForTimeout(50);
	const steps = 18;
	for (let i = 1; i <= steps; i++) {
		const t = i / steps;
		const x = start.x + (end.x - start.x) * t;
		const y = start.y + (end.y - start.y) * t;
		await session.send('Input.dispatchTouchEvent', {
			type: 'touchMove',
			touchPoints: finger(x, y)
		});
	}
	await session.send('Input.dispatchTouchEvent', {
		type: 'touchEnd',
		touchPoints: []
	});
	await session.detach().catch(() => undefined);
	await reorder;
}
