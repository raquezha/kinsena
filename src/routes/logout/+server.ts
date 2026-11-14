import { redirect } from '@sveltejs/kit';
import { sessionCookieOptions, SESSION_COOKIE } from '#lib/server/http/session-cookie.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies, locals, request }) => {
	locals.services.auth.logout(locals.sessionToken);
	const { path, httpOnly, sameSite, secure } = sessionCookieOptions(request.headers.get('host'));
	cookies.delete(SESSION_COOKIE, { path, httpOnly, sameSite, secure });
	redirect(303, '/login');
};
