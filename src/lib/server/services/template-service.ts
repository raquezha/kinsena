import { parseOptionalAmount } from '../../domain/amount-parser.ts';
import { ensure } from '../../domain/errors.ts';
import type { FundFrom } from '../../domain/fund-from.ts';
import type { TemplateItem } from '../../domain/models.ts';
import { ensureMoney, normalizeDueDay, normalizeName } from '../../domain/rules.ts';
import type { Clock, Repositories } from '../ports.ts';
import { applyTemplateToUpcoming } from './payday-service.ts';

export interface TemplateInput {
	name: string;
	amount: string;
	minimum: string;
	dueDay: string;
	fundFrom: FundFrom;
	destinationId: number | null;
}

export interface TemplateService {
	list(): TemplateItem[];
	add(input: TemplateInput): number;
	update(id: number, input: TemplateInput): void;
	archive(id: number): void;
}

function parseDueDay(raw: string | null | undefined): number | null {
	const text = (raw ?? '').trim();
	if (text === '') return null;
	const value = Number(text);
	ensure(Number.isInteger(value), 'Due day must be between 1 and 31');
	return normalizeDueDay(value);
}

function parsed(input: TemplateInput) {
	const defaultAmount = parseOptionalAmount(input.amount);
	const minimumAmount = parseOptionalAmount(input.minimum);
	ensureMoney(defaultAmount, 'amount');
	ensureMoney(minimumAmount, 'minimum');
	return {
		name: normalizeName(input.name),
		defaultAmount,
		minimumAmount,
		dueDay: parseDueDay(input.dueDay),
		fundFrom: input.fundFrom,
		destinationId: input.destinationId
	};
}

export function createTemplateService(repos: Repositories, clock: Clock): TemplateService {
	const { templates } = repos;
	const service: TemplateService = {
		list: () => templates.listActive(),
		add(input) {
			const fields = parsed(input);
			const id = templates.add({ ...fields, createdAt: clock.now().getTime() });
			const saved = templates.findById(id);
			if (saved) applyTemplateToUpcoming(repos, saved);
			return id;
		},
		update(id, input) {
			ensure(templates.update(id, parsed(input)), 'Unknown saved item');
		},
		archive(id) {
			ensure(templates.archive(id), 'Unknown saved item');
		}
	};
	return service;
}
