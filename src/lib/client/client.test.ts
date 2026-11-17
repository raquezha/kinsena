import { describe, expect, it } from 'vitest';
import type { RouteItem } from '../domain/models.ts';
import {
	clearOrder,
	hide,
	NO_CHANGES,
	setOrder,
	setPaid,
	settle,
	withPending
} from './optimistic.ts';
import {
	isSidebarCollapsedCookie,
	SIDEBAR_COLLAPSED_COOKIE,
	sidebarCollapsedCookie
} from './sidebar.ts';
import { shortcutFor } from './shortcuts.ts';

const item = (id: number, isDone = false): RouteItem => ({
	id,
	paydayId: 1,
	destinationId: null,
	name: `Item ${id}`,
	fullAmount: 100,
	fullAmountExpr: '1',
	minimumAmount: null,
	chosenAmount: 0,
	decision: 'PENDING',
	decisionReason: null,
	dueDate: null,
	isDone,
	sortOrder: id,
	templateId: null,
	icon: null
});

describe('optimistic checklist', () => {
	const items = [item(1), item(2), item(3, true)];

	it('shows server items unchanged when nothing is pending', () => {
		expect(withPending(items, NO_CHANGES).map((entry) => entry.id)).toEqual([1, 2, 3]);
	});

	it('applies done changes and moves done items down', () => {
		const pending = setPaid(setPaid(NO_CHANGES, 1, true), 3, false);
		const shown = withPending(items, pending);
		expect(shown.map((entry) => [entry.id, entry.isDone])).toEqual([
			[2, false],
			[3, false],
			[1, true]
		]);
		expect(items[0]?.isDone).toBe(false);
	});

	it('hides deleted items until settled', () => {
		const pending = hide(setPaid(NO_CHANGES, 2, true), 2);
		expect(withPending(items, pending).map((entry) => entry.id)).toEqual([1, 3]);
		const settled = settle(pending, 2);
		expect(settled.paid.size).toBe(0);
		expect(withPending(items, settled)).toHaveLength(3);
	});

	it('applies saved open order without waiting for a page refresh', () => {
		const pending = setOrder(NO_CHANGES, [2, 1]);
		expect(withPending(items, pending).map((entry) => entry.id)).toEqual([2, 1, 3]);
	});

	it('keeps order overlay across settle, drops it on clearOrder, and prunes hide', () => {
		const ordered = setOrder(NO_CHANGES, [2, 1]);
		const afterSettle = settle(ordered, 1);
		expect(afterSettle.order?.get(2)).toBe(0);
		expect(withPending(items, afterSettle).map((entry) => entry.id)).toEqual([2, 1, 3]);

		const afterHide = hide(ordered, 2);
		expect(afterHide.order?.has(2)).toBe(false);
		expect(afterHide.hidden.has(2)).toBe(true);

		expect(clearOrder(ordered).order).toBeNull();
		expect(clearOrder(NO_CHANGES)).toBe(NO_CHANGES);

		const lastRanked = setOrder(NO_CHANGES, [1]);
		expect(hide(lastRanked, 1).order).toBeNull();
	});

	it('parity: optimistic setOrder matches open-list id sequence after withPending', () => {
		const sequence = [2, 1] as const;
		const pending = setOrder(NO_CHANGES, sequence);
		const open = withPending(items, pending).filter((entry) => !entry.isDone);
		expect(open.map((entry) => entry.id)).toEqual([...sequence]);
		expect(open.map((entry) => entry.sortOrder)).toEqual([0, 1]);
	});
});

describe('keyboard shortcuts', () => {
	const press = (key: string, extra: Partial<Parameters<typeof shortcutFor>[0]> = {}) =>
		shortcutFor({
			key,
			metaKey: false,
			ctrlKey: false,
			altKey: false,
			targetTag: 'BODY',
			targetEditable: false,
			dialogOpen: false,
			...extra
		});

	it('maps number keys to tabs and letters to sheets', () => {
		expect(press('2')).toEqual({ kind: 'navigate', href: '/history' });
		expect(press('N')).toEqual({ kind: 'sheet', name: 'add' });
		expect(press('c')).toEqual({ kind: 'sheet', name: 'cycle' });
		expect(press('i')).toEqual({ kind: 'sheet', name: 'receive' });
		expect(press('x')).toEqual({ kind: 'none' });
	});

	it('stays out of the way while typing or with modifiers', () => {
		expect(press('n', { targetTag: 'INPUT' })).toEqual({ kind: 'none' });
		expect(press('n', { targetEditable: true })).toEqual({ kind: 'none' });
		expect(press('1', { metaKey: true })).toEqual({ kind: 'none' });
		expect(press('n', { dialogOpen: true })).toEqual({ kind: 'none' });
	});
});

describe('sidebar collapse cookie', () => {
	it('treats only the string true as collapsed', () => {
		expect(isSidebarCollapsedCookie('true')).toBe(true);
		expect(isSidebarCollapsedCookie('false')).toBe(false);
		expect(isSidebarCollapsedCookie(undefined)).toBe(false);
		expect(isSidebarCollapsedCookie(null)).toBe(false);
	});

	it('writes a path-scoped Lax cookie for a year', () => {
		expect(sidebarCollapsedCookie(true)).toBe(
			`${SIDEBAR_COLLAPSED_COOKIE}=true; Path=/; Max-Age=31536000; SameSite=Lax`
		);
		expect(sidebarCollapsedCookie(false)).toContain(`${SIDEBAR_COLLAPSED_COOKIE}=false`);
	});
});
