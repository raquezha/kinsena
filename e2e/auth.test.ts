import { expect, test } from '@playwright/test';
import { nav, signIn } from './support/app.ts';

test('redirects signed-out visitors to the login page', async ({ page }) => {
	await page.goto('/history');
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('heading', { name: 'Kinsena' })).toBeVisible();
});

test('rejects a wrong passphrase with a message', async ({ page }) => {
	await page.goto('/login');
	await page.getByLabel('Passphrase').fill('definitely the wrong passphrase');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('alert')).toHaveText('That passphrase did not match.');
	await expect(page).toHaveURL(/\/login$/);
});

test('signs in with a strict, HTTP-only session cookie and logs out', async ({ page, context }) => {
	await signIn(page);
	const [cookie] = await context.cookies();
	expect(cookie).toMatchObject({ name: 'kinsena_session', httpOnly: true, sameSite: 'Strict' });

	await nav(page, 'Settings').click();
	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page).toHaveURL(/\/login$/);
	await page.goto('/');
	await expect(page).toHaveURL(/\/login$/);
});

test('blocks cross-site form posts and unauthenticated actions', async ({ page, request }) => {
	const anonymous = await request.post('/?/other', { form: { title: 'x', date: '2026-11-20' } });
	expect(anonymous.status()).toBe(401);

	await signIn(page);
	const crossSite = await page.request.post('/?/other', {
		form: { title: 'x', date: '2026-11-20' },
		headers: { origin: 'https://evil.example' }
	});
	expect(crossSite.status()).toBe(403);
});

test('sends security headers', async ({ request }) => {
	const response = await request.get('/login');
	expect(response.headers()).toMatchObject({
		'x-frame-options': 'DENY',
		'x-content-type-options': 'nosniff'
	});
});
