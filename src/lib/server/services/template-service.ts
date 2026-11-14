import { parseOptionalAmount } from '../../domain/amount-parser.ts';
import type { Cadence } from '../../domain/cadence.ts';
import { ensure } from '../../domain/errors.ts';
import type { TemplateItem } from '../../domain/models.ts';
import { normalizeName } from '../../domain/rules.ts';
import type { Clock, TemplateRepository } from '../ports.ts';

export interface NewTemplateInput {
	name: string;
	amount: string;
	cadence: Cadence;
}

export interface TemplateService {
	list(): TemplateItem[];
	add(input: NewTemplateInput): number;
	updateAmount(id: number, amount: string): void;
	archive(id: number): void;
}

export function createTemplateService(templates: TemplateRepository, clock: Clock) {
	const service: TemplateService = {
		list: () => templates.listActive(),
		add(input) {
			return templates.add({
				name: normalizeName(input.name),
				defaultAmount: parseOptionalAmount(input.amount),
				cadence: input.cadence,
				createdAt: clock.now().getTime()
			});
		},
		updateAmount(id, amount) {
			const updated = templates.updateAmount(id, parseOptionalAmount(amount));
			ensure(updated, 'Unknown saved item');
		},
		archive(id) {
			ensure(templates.archive(id), 'Unknown saved item');
		}
	};
	return service;
}
