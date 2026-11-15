// Visual review set: every screen and state, three layouts, light and dark.
// Run: npx playwright test e2e/polish-shots.test.ts --project=screenshots
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import {
	addDefault,
	addDestination,
	addItem,
	clearToasts,
	markSalaryIn,
	row,
	sheet,
	signIn
} from './support/app.ts';

const OUT = '/tmp/kinsena-polish-shots';
const LAYOUTS = [
	{ name: 'mobile', width: 390, height: 844 },
	{ name: 'tablet', width: 834, height: 1112 },
	{ name: 'desktop', width: 1440, height: 900 }
] as const;
const SCHEMES = ['light', 'dark'] as const;

async function theme(page: Page, scheme: (typeof SCHEMES)[number]): Promise<void> {
	await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
}

async function resize(page: Page, layout: (typeof LAYOUTS)[number]): Promise<void> {
	await page.setViewportSize({ width: layout.width, height: layout.height });
}

async function shot(page: Page, scheme: string, layout: string, name: string): Promise<void> {
	const dir = `${OUT}/${scheme}/${layout}`;
	mkdirSync(dir, { recursive: true });
	await page.screenshot({ path: `${dir}/${name}.png`, fullPage: false, animations: 'disabled' });
}

/** Recapture the current app state in every theme and layout. */
async function capture(page: Page, name: string, open: () => Promise<void>): Promise<void> {
	for (const scheme of SCHEMES) {
		await theme(page, scheme);
		for (const layout of LAYOUTS) {
			await resize(page, layout);
			await open();
			await clearToasts(page);
			await shot(page, scheme, layout.name, name);
		}
	}
}

test('captures every screen and state for visual review', async ({ page }) => {
	test.setTimeout(360_000);

	for (const scheme of SCHEMES) {
		await theme(page, scheme);
		for (const layout of LAYOUTS) {
			await resize(page, layout);
			await page.context().clearCookies();
			await page.goto('/login');
			await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
			await shot(page, scheme, layout.name, '01-login');
			await page.getByLabel('Passphrase').fill('wrong-passphrase!!!!');
			await page.getByRole('button', { name: 'Sign in' }).click();
			await expect(page.getByRole('alert')).toBeVisible();
			await shot(page, scheme, layout.name, '02-login-error');
		}
	}

	await page.context().clearCookies();
	await resize(page, LAYOUTS[0]);
	await theme(page, 'light');
	await signIn(page);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	await capture(page, '03-plan-empty', async () => {
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	});
	await capture(page, '04-history-empty', async () => {
		await page.goto('/history');
		await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
	});
	await capture(page, '05-defaults-empty', async () => {
		await page.goto('/defaults');
		await expect(page.getByRole('heading', { name: 'Defaults' })).toBeVisible();
	});
	await capture(page, '06-settings', async () => {
		await page.goto('/settings');
		await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
	});

	await resize(page, LAYOUTS[0]);
	await addDestination(page, 'BPI Savings', 'Account');
	await addDestination(page, 'Meralco', 'Biller');
	await addDefault(page, 'Rent', '12,000');
	await addDefault(page, 'Internet', '1,699');
	await addDefault(page, 'Electricity');
	await addDefault(page, 'Savings', '5,000');
	await page.goto('/');
	await addItem(page, 'Card statement', '8,400', '2026-11-20');
	await addItem(
		page,
		'A very long obligation name that should truncate cleanly beside the amount',
		'1,234,567.89'
	);
	await clearToasts(page);

	await capture(page, '07-plan-mode', async () => {
		await page.goto('/');
		await expect(row(page, 'Rent')).toBeVisible();
	});

	for (const scheme of SCHEMES) {
		await theme(page, scheme);
		for (const layout of LAYOUTS) {
			await resize(page, layout);
			await page.goto('/');
			await page
				.getByRole('link', { name: /Salary in/ })
				.first()
				.click();
			await expect(sheet(page, 'Salary in')).toBeVisible();
			await page.waitForTimeout(250);
			await shot(page, scheme, layout.name, '08-salary-in-sheet');
			await page.keyboard.press('Escape');
			await expect(sheet(page, 'Salary in')).toBeHidden();
		}
	}

	await resize(page, LAYOUTS[0]);
	await page.goto('/');
	await markSalaryIn(page, '38,500');
	await row(page, 'Rent').getByRole('button', { name: 'Full' }).click();
	await page.getByRole('button', { name: 'Mark Rent routed' }).click();
	await clearToasts(page);

	await capture(page, '09-routing-bayad', async () => {
		await page.goto('/');
		const rent = row(page, 'Rent');
		await expect(rent).toContainText('Bayad na');
		await rent.scrollIntoViewIfNeeded();
	});

	for (const scheme of SCHEMES) {
		await theme(page, scheme);
		for (const layout of LAYOUTS) {
			await resize(page, layout);
			await page.goto('/');
			await row(page, 'Internet').getByRole('button', { name: 'Custom' }).click();
			await expect(sheet(page, 'Custom amount')).toBeVisible();
			await page.waitForTimeout(250);
			await shot(page, scheme, layout.name, '10-custom-amount');
			await page.keyboard.press('Escape');
			await expect(sheet(page, 'Custom amount')).toBeHidden();

			await row(page, 'Card statement').getByRole('button', { name: 'Skip' }).click();
			const skip = sheet(page, /Skip Card statement/);
			await expect(skip).toBeVisible();
			await expect(skip.getByRole('status')).toBeVisible();
			await page.waitForTimeout(250);
			await shot(page, scheme, layout.name, '11-skip-warning');
			await page.keyboard.press('Escape');
			await expect(skip).toBeHidden();

			await row(page, 'Electricity').getByRole('link').click();
			await expect(sheet(page, 'Electricity')).toBeVisible();
			await page.waitForTimeout(250);
			await shot(page, scheme, layout.name, '12-item-editor');
			await page.keyboard.press('Escape');
			await expect(sheet(page, 'Electricity')).toBeHidden();
		}
	}

	await resize(page, LAYOUTS[0]);
	await page.goto('/');
	const other = page.getByRole('navigation', { name: 'Paydays' }).getByRole('link').nth(1);
	if ((await other.count()) > 0) {
		await other.click();
		if ((await page.getByRole('link', { name: /Salary in/ }).count()) > 0) {
			await markSalaryIn(page, '20,000');
		}
		await clearToasts(page);
		await capture(page, '13-kept-payday', async () => {
			await page.goto(page.url());
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		});
	}

	await capture(page, '14-defaults-filled', async () => {
		await page.goto('/defaults');
		await expect(page.getByText('Rent')).toBeVisible();
	});

	await resize(page, LAYOUTS[0]);
	await page.goto('/');
	const first = page.getByRole('navigation', { name: 'Paydays' }).getByRole('link').first();
	if ((await first.count()) > 0) await first.click();
	await page.getByRole('link', { name: 'Salary, note and finish' }).click();
	const paydaySheet = sheet(page, 'This payday');
	await expect(paydaySheet).toBeVisible();
	await paydaySheet.getByRole('button', { name: 'Finish payday' }).click();
	const confirm = paydaySheet.getByRole('button', { name: 'Yes, finish it' });
	if ((await confirm.count()) > 0) await confirm.click();
	await expect(paydaySheet).toBeHidden();

	await capture(page, '15-history', async () => {
		await page.goto('/history');
		await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
	});
});
