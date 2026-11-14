import { fail, redirect } from '@sveltejs/kit';
import { sessionCookieOptions, SESSION_COOKIE } from '#lib/server/http/session-cookie.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.authenticated) redirect(303, '/');
};

const MESSAGES = {
	invalid: 'That passphrase did not match.',
	'rate-limited': 'Too many attempts. Wait a minute, then try again.'
} as const;

export const actions: Actions = {
	default: async ({ request, cookies, locals }) => {
		const password = (await request.formData()).get('password');
		const result = locals.services.auth.login(typeof password === 'string' ? password : '');
		if (!result.ok) return fail(401, { error: MESSAGES[result.reason] });
		cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions(request.headers.get('host')));
		redirect(303, '/');
	}
};
