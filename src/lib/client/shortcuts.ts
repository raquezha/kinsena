export type Shortcut =
	{ kind: 'navigate'; href: string } | { kind: 'sheet'; name: string } | { kind: 'none' };

export const TAB_SHORTCUTS: Record<string, string> = {
	'1': '/',
	'2': '/history',
	'3': '/defaults',
	'4': '/settings'
};

export const SHEET_SHORTCUTS: Record<string, string> = {
	n: 'add',
	c: 'cycle',
	i: 'receive'
};

interface KeyInput {
	key: string;
	metaKey: boolean;
	ctrlKey: boolean;
	altKey: boolean;
	targetTag: string;
	targetEditable: boolean;
	dialogOpen: boolean;
}

/** Maps a key press to an app shortcut. Ignores typing, modifiers and open dialogs. */
export function shortcutFor(input: KeyInput): Shortcut {
	const typing = input.targetEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(input.targetTag);
	if (typing || input.metaKey || input.ctrlKey || input.altKey || input.dialogOpen) {
		return { kind: 'none' };
	}
	const key = input.key.toLowerCase();
	const href = TAB_SHORTCUTS[key];
	if (href) return { kind: 'navigate', href };
	const sheet = SHEET_SHORTCUTS[key];
	return sheet ? { kind: 'sheet', name: sheet } : { kind: 'none' };
}
