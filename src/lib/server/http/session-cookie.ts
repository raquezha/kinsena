import { SESSION_TTL_SECONDS } from '../auth/session-store.ts';

// Cookies ignore port. Vite and live Docker on the same Tailscale IP must not share a name.
export const SESSION_COOKIE =
	process.env.KINSENA_SESSION_COOKIE?.trim() ||
	(process.env.NODE_ENV === 'production' ? 'kinsena_session' : 'kinsena_session_dev');

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Tailscale addresses (100.64.0.0/10) travel inside WireGuard, so plain HTTP is still private. */
function isTailnetAddress(hostname: string): boolean {
	const match = /^100\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(hostname);
	const second = Number(match?.[1] ?? -1);
	return second >= 64 && second <= 127;
}

export function hostnameOf(hostHeader: string | null): string {
	const host = (hostHeader ?? '').toLowerCase();
	return host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : (host.split(':')[0] ?? '');
}

/** Secure cookies everywhere except loopback and tailnet IPs reached over plain HTTP. */
export function needsSecureCookie(hostHeader: string | null): boolean {
	const hostname = hostnameOf(hostHeader);
	return !LOOPBACK_HOSTS.has(hostname) && !isTailnetAddress(hostname);
}

export function sessionCookieOptions(hostHeader: string | null) {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'strict' as const,
		secure: needsSecureCookie(hostHeader),
		maxAge: SESSION_TTL_SECONDS
	};
}
