/** Desktop sidebar collapse preference — cookies ignore port, so keep this name stable. */
export const SIDEBAR_COLLAPSED_COOKIE = 'kinsena_sidebar_collapsed';
export const SIDEBAR_COLLAPSED_MAX_AGE = 60 * 60 * 24 * 365;

export function isSidebarCollapsedCookie(value: string | undefined | null): boolean {
	return value === 'true';
}

/** Client Set-Cookie string for document.cookie (SSR reads the same name). */
export function sidebarCollapsedCookie(collapsed: boolean): string {
	return `${SIDEBAR_COLLAPSED_COOKIE}=${collapsed ? 'true' : 'false'}; Path=/; Max-Age=${SIDEBAR_COLLAPSED_MAX_AGE}; SameSite=Lax`;
}
