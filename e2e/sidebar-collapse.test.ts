import { expect, test, type Page } from '@playwright/test';
import { signIn } from './support/app.ts';

const SIDEBAR_COOKIE = 'kinsena_sidebar_collapsed';

function mainNav(page: Page) {
	return page.getByRole('navigation', { name: 'Main' });
}

function toggle(page: Page) {
	return page.getByTestId('sidebar-toggle');
}

async function navBox(page: Page) {
	return mainNav(page).boundingBox();
}

async function expectExpanded(page: Page) {
	const nav = mainNav(page);
	await expect(nav).toHaveAttribute('data-collapsed', 'false');
	await expect(nav).not.toHaveClass(/collapsed/);
	await expect.poll(async () => (await navBox(page))?.width ?? 0).toBeGreaterThan(200);
	await expect(toggle(page)).toHaveAttribute('aria-label', 'Close sidebar');
	await expect(nav.getByText('Shortcuts:')).toBeVisible();
}

async function expectCollapsed(page: Page) {
	const nav = mainNav(page);
	await expect(nav).toHaveAttribute('data-collapsed', 'true');
	await expect(nav).toHaveClass(/collapsed/);
	await expect.poll(async () => (await navBox(page))?.width ?? 0).toBeLessThan(120);
	await expect(toggle(page)).toHaveAttribute('aria-label', 'Open sidebar');
	await expect(nav.getByText('Shortcuts:')).toBeHidden();
}

async function cookieValue(page: Page) {
	const cookies = await page.context().cookies();
	return cookies.find((cookie) => cookie.name === SIDEBAR_COOKIE)?.value;
}

async function tip(page: Page) {
	return toggle(page).locator('.collapse-tip');
}

/** Expanded tip below; collapsed tip to the right — both unclipped. */
async function expectTipUnclipped(page: Page, label: string) {
	const btn = toggle(page);
	const tipEl = await tip(page);
	await expect(tipEl).toHaveText(label);
	await btn.hover();
	await expect.poll(async () => tipEl.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');

	const btnBox = await btn.boundingBox();
	const tipBox = await tipEl.boundingBox();
	expect(btnBox).toBeTruthy();
	expect(tipBox).toBeTruthy();
	if (!btnBox || !tipBox) return;

	expect(tipBox.width).toBeGreaterThan(40);
	expect(tipBox.height).toBeGreaterThan(12);

	if (label === 'Open sidebar') {
		expect(tipBox.x).toBeGreaterThanOrEqual(btnBox.x + btnBox.width - 2);
		const btnMid = btnBox.y + btnBox.height / 2;
		const tipMid = tipBox.y + tipBox.height / 2;
		expect(Math.abs(tipMid - btnMid)).toBeLessThan(14);
	} else {
		expect(tipBox.y).toBeGreaterThanOrEqual(btnBox.y + btnBox.height - 2);
	}

	// Tip is pointer-events:none — check ancestors do not clip its box.
	const clipped = await tipEl.evaluate((el) => {
		const rect = el.getBoundingClientRect();
		let parent = el.parentElement;
		while (parent) {
			const { overflow, overflowX, overflowY } = getComputedStyle(parent);
			const clips =
				(overflow !== 'visible' && overflow !== '') ||
				(overflowX !== 'visible' && overflowX !== '') ||
				(overflowY !== 'visible' && overflowY !== '');
			if (clips) {
				const box = parent.getBoundingClientRect();
				if (
					rect.left < box.left - 1 ||
					rect.right > box.right + 1 ||
					rect.top < box.top - 1 ||
					rect.bottom > box.bottom + 1
				) {
					return true;
				}
			}
			parent = parent.parentElement;
		}
		return false;
	});
	expect(clipped).toBe(false);
}

test('desktop: button and keyboard collapse frames stay in parity', async ({ page }) => {
	test.skip(test.info().project.name !== 'desktop', 'desktop only');
	await page.context().clearCookies();
	await signIn(page);

	await expectExpanded(page);
	// Frame 0 → expanded tip below button, unclipped
	await expectTipUnclipped(page, 'Close sidebar');

	// Frame 1 → collapsed via button
	await toggle(page).click();
	await expectCollapsed(page);
	await expect.poll(cookieValue.bind(null, page)).toBe('true');
	// Stacked rail pills must be rounded-2xl (not giant circles).
	await expect
		.poll(async () =>
			mainNav(page)
				.getByRole('link', { name: 'Active' })
				.evaluate((el) => getComputedStyle(el).borderRadius)
		)
		.toBe('16px');
	await expectTipUnclipped(page, 'Open sidebar');

	// Frame 2 → expanded via button
	await toggle(page).click();
	await expectExpanded(page);
	await expect.poll(cookieValue.bind(null, page)).toBe('false');
	await expectTipUnclipped(page, 'Close sidebar');

	// Frame 3 → collapsed via keyboard, expanded via button
	await page.keyboard.press('[');
	await expectCollapsed(page);
	await expectTipUnclipped(page, 'Open sidebar');
	await toggle(page).click();
	await expectExpanded(page);

	// Edge line on both frames
	const nav = mainNav(page);
	await expect
		.poll(async () => nav.evaluate((el) => getComputedStyle(el).borderRightWidth))
		.toBe('1px');
	await toggle(page).click();
	await expectCollapsed(page);
	await expect
		.poll(async () => nav.evaluate((el) => getComputedStyle(el).borderRightWidth))
		.toBe('1px');
});

test('desktop: hard refresh keeps collapsed SSR frame', async ({ page }) => {
	test.skip(test.info().project.name !== 'desktop', 'desktop only');
	await page.context().clearCookies();
	await signIn(page);
	await toggle(page).click();
	await expectCollapsed(page);

	await page.reload();
	const nav = mainNav(page);
	await expect(nav).toHaveAttribute('data-collapsed', 'true');
	await expect(nav).toHaveClass(/collapsed/);
	const box = await navBox(page);
	expect(box?.width ?? 0).toBeLessThan(120);
});

test('tablet: rail only — toggle stays hidden', async ({ page }) => {
	test.skip(test.info().project.name !== 'tablet', 'tablet only');
	await signIn(page);
	await expect(toggle(page)).toBeHidden();
	const box = await navBox(page);
	expect(box?.width ?? 0).toBeLessThan(120);
});

test('mobile: bottom bar — toggle stays hidden', async ({ page }) => {
	test.skip(test.info().project.name !== 'mobile', 'mobile only');
	await signIn(page);
	await expect(toggle(page)).toBeHidden();
	const box = await navBox(page);
	expect(box?.height ?? 0).toBeGreaterThan(40);
	expect(box?.y ?? 0).toBeGreaterThan(600);
});
