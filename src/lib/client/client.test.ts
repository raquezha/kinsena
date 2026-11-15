import { describe, expect, it } from 'vitest';
import type { RouteItem } from '../domain/models.ts';
import { hide, NO_CHANGES, setPaid, settle, withPending } from './optimistic.ts';
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
	templateId: null
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
