const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const PUBLIC_PATHS = new Set(['/login']);

/** True for a state-changing request whose Origin is not this host. */
export function isCrossSiteChange(method: string, origin: string | null, host: string | null) {
	if (SAFE_METHODS.has(method) || origin === null) return false;
	try {
		return new URL(origin).host.toLowerCase() !== (host ?? '').toLowerCase();
	} catch {
		return true;
	}
}

export function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.has(pathname);
}

export function isSafeMethod(method: string): boolean {
	return SAFE_METHODS.has(method);
}
