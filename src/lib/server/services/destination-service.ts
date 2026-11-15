import type { DestinationKind } from '../../domain/destination.ts';
import { ensure } from '../../domain/errors.ts';
import type { Destination } from '../../domain/models.ts';
import { normalizeName } from '../../domain/rules.ts';
import type { Clock, DestinationRepository } from '../ports.ts';

export interface DestinationService {
	list(): Destination[];
	add(name: string, kind: DestinationKind): number;
	update(id: number, name: string, kind: DestinationKind): void;
	archive(id: number): void;
}

export function createDestinationService(destinations: DestinationRepository, clock: Clock) {
	const service: DestinationService = {
		list: () => destinations.listActive(),
		add(name, kind) {
			return destinations.add({
				name: normalizeName(name),
				kind,
				createdAt: clock.now().getTime()
			});
		},
		update(id, name, kind) {
			ensure(destinations.update(id, { name: normalizeName(name), kind }), 'Unknown destination');
		},
		archive(id) {
			ensure(destinations.archive(id), 'Unknown destination');
		}
	};
	return service;
}
