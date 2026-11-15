import { ensure } from '../../domain/errors.ts';
import type { Payday, RouteItem } from '../../domain/models.ts';
import type { PaydayRepository, RouteItemRepository } from '../ports.ts';

export function requirePayday(paydays: PaydayRepository, paydayId: number): Payday {
	const payday = paydays.findById(paydayId);
	ensure(payday !== null, 'Unknown payday');
	return payday;
}

export function requireOpenPayday(paydays: PaydayRepository, paydayId: number): Payday {
	const payday = requirePayday(paydays, paydayId);
	ensure(!payday.isClosed, 'This payday is already finished');
	return payday;
}

export function requireItem(items: RouteItemRepository, itemId: number): RouteItem {
	const item = items.findById(itemId);
	ensure(item !== null, 'Unknown item');
	return item;
}

/** An item that can still be edited: on an open payday, or still in the inbox. */
export function requireActiveItem(
	paydays: PaydayRepository,
	items: RouteItemRepository,
	itemId: number
): RouteItem {
	const item = requireItem(items, itemId);
	if (item.paydayId !== null) requireOpenPayday(paydays, item.paydayId);
	return item;
}
