import { redirect } from '@sveltejs/kit';
import { sequence, type Handle, type ServerInit } from '@sveltejs/kit/hooks';
import { loadConfig } from '#lib/server/config.ts';
import { createAppServices, type Services } from '#lib/server/container.ts';
import { isCrossSiteChange, isPublicPath, isSafeMethod } from '#lib/server/http/request-guards.ts';
import { SESSION_COOKIE } from '#lib/server/http/session-cookie.ts';

let services: Services | undefined;

/** Runs once at start-up. Throwing here stops the server, e.g. for a short passphrase. */
export const init: ServerInit = () => {
	services = createAppServices(loadConfig(process.env));
};

const rejectCrossSite: Handle = ({ event, resolve }) => {
	const { method, headers } = event.request;
	if (isCrossSiteChange(method, headers.get('origin'), headers.get('host'))) {
		return new Response('Cross-site changes are not allowed', { status: 403 });
	}
	return resolve(event);
};

const authenticate: Handle = ({ event, resolve }) => {
	if (!services) throw new Error('Kinsena did not start');
	const token = event.cookies.get(SESSION_COOKIE) ?? null;
	event.locals.services = services;
	event.locals.sessionToken = token;
	event.locals.authenticated = services.auth.isSignedIn(token);
	return resolve(event);
};

const requireSignIn: Handle = ({ event, resolve }) => {
	if (event.locals.authenticated || isPublicPath(event.url.pathname)) return resolve(event);
	if (isSafeMethod(event.request.method)) redirect(303, '/login');
	return Promise.resolve(new Response('Sign in first', { status: 401 }));
};

const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'same-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	if (!response.headers.has('Cache-Control')) response.headers.set('Cache-Control', 'no-store');
	return response;
};

export const handle = sequence(rejectCrossSite, authenticate, requireSignIn, securityHeaders);
