import type { IconName } from '../icons/paths.ts';

export interface NavItem {
	href: string;
	label: string;
	icon: IconName;
	shortcut: string;
}

export const NAV_ITEMS: NavItem[] = [
	{ href: '/', label: 'Active', icon: 'checklist', shortcut: '1' },
	{ href: '/history', label: 'History', icon: 'history', shortcut: '2' },
	{ href: '/defaults', label: 'Defaults', icon: 'defaults', shortcut: '3' },
	{ href: '/settings', label: 'Settings', icon: 'settings', shortcut: '4' }
];

export function isCurrent(item: NavItem, pathname: string): boolean {
	return item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
}
