import { parseAmount } from '../../domain/amount-parser.ts';
import type { CycleItem } from '../../domain/models.ts';
import { normalizeName } from '../../domain/rules.ts';
import type { Repositories } from '../ports.ts';
import { requireActiveItem, requireOpenCycle } from './guards.ts';

/** Everything needed to put a deleted item back when the user taps Undo. */
export type RemovedItem = Pick<
	CycleItem,
	'cycleId' | 'name' | 'amountExpr' | 'isDone' | 'sortOrder'
>;

export interface ItemService {
	add(cycleId: number, name: string, amount: string): number;
	/** Returns true when the item is now marked paid. */
	toggle(itemId: number): boolean;
	setAmount(itemId: number, amount: string): void;
	remove(itemId: number): RemovedItem;
	restore(removed: RemovedItem): number;
}

type Deps = Pick<Repositories, 'cycles' | 'items'>;

export function createItemService({ cycles, items }: Deps) {
	const insert = (cycleId: number, name: string, amount: string, isDone: boolean, at?: number) => {
		const cleanName = normalizeName(name);
		const parsed = parseAmount(amount);
		requireOpenCycle(cycles, cycleId);
		return items.add(cycleId, {
			name: cleanName,
			amount: parsed.cents,
			amountExpr: parsed.expression,
			isDone,
			sortOrder: at ?? items.maxSortOrder(cycleId) + 1
		});
	};

	const service: ItemService = {
		add: (cycleId, name, amount) => insert(cycleId, name, amount, false),
		toggle(itemId) {
			const item = requireActiveItem(cycles, items, itemId);
			items.update(itemId, { isDone: !item.isDone });
			return !item.isDone;
		},
		setAmount(itemId, amount) {
			const parsed = parseAmount(amount);
			requireActiveItem(cycles, items, itemId);
			items.update(itemId, { amount: parsed.cents, amountExpr: parsed.expression });
		},
		remove(itemId) {
			const { cycleId, name, amountExpr, isDone, sortOrder } = requireActiveItem(
				cycles,
				items,
				itemId
			);
			items.remove(itemId);
			return { cycleId, name, amountExpr, isDone, sortOrder };
		},
		restore(removed) {
			const { cycleId, name, amountExpr, isDone, sortOrder } = removed;
			return insert(cycleId, name, amountExpr ?? '', isDone, sortOrder);
		}
	};
	return service;
}
