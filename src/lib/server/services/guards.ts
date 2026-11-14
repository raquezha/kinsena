import { ensure } from '../../domain/errors.ts';
import type { Cycle, CycleItem } from '../../domain/models.ts';
import type { CycleRepository, ItemRepository } from '../ports.ts';

export function requireOpenCycle(cycles: CycleRepository, cycleId: number): Cycle {
	const cycle = cycles.findById(cycleId);
	ensure(cycle !== null && !cycle.isClosed, 'This cycle is already finished');
	return cycle;
}

export function requireActiveItem(
	cycles: CycleRepository,
	items: ItemRepository,
	itemId: number
): CycleItem {
	const item = items.findById(itemId);
	const cycle = item ? cycles.findById(item.cycleId) : null;
	ensure(item !== null && cycle !== null && !cycle.isClosed, 'Item is not in the active cycle');
	return item;
}
