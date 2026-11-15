import { z } from 'zod';
import { PAYDAY_CADENCES } from '../../domain/cadence.ts';
import { CURRENCY_CODES } from '../../domain/currency.ts';
import { DECISIONS } from '../../domain/decision.ts';
import { DESTINATION_KINDS } from '../../domain/destination.ts';
import { DomainError } from '../../domain/errors.ts';
import { FUND_FROMS } from '../../domain/fund-from.ts';
import { MAX_EXPRESSION_LENGTH } from '../../domain/amount-parser.ts';

const text = (max: number) =>
	z
		.string()
		.max(max * 4)
		.default('');

export const fields = {
	id: z.coerce.number().int().positive(),
	optionalId: z
		.string()
		.default('')
		.transform((value) => {
			const trimmed = value.trim();
			if (trimmed === '') return null;
			const id = Number(trimmed);
			if (!Number.isInteger(id) || id <= 0) throw new DomainError('Check the form and try again');
			return id;
		}),
	name: text(128),
	title: text(128),
	note: text(280),
	position: z.coerce.number().int().min(0).max(2_147_483_647),
	amount: z
		.string()
		.max(MAX_EXPRESSION_LENGTH * 2)
		.default(''),
	date: text(32),
	dueDay: text(2),
	cadence: z.enum(PAYDAY_CADENCES).default('OTHER'),
	fundFrom: z.enum(FUND_FROMS).default('BEFORE_DUE'),
	decision: z.enum(DECISIONS),
	kind: z.enum(DESTINATION_KINDS),
	currency: z.enum(CURRENCY_CODES as [string, ...string[]]),
	flag: z.enum(['true', 'false']).transform((value) => value === 'true'),
	cents: z
		.string()
		.default('')
		.transform((value) => {
			const text = value.trim();
			if (text === '' || text === 'null') return null;
			const cents = Number(text);
			if (!Number.isSafeInteger(cents) || cents < 0) {
				throw new DomainError('Check the form and try again');
			}
			return cents;
		}),
	json: z
		.string()
		.max(20_000)
		.transform((value) => {
			try {
				return JSON.parse(value) as unknown;
			} catch {
				throw new DomainError('Check the form and try again');
			}
		})
};

/** Reads string fields from a form and validates their shape. Throws DomainError. */
export async function readForm<Shape extends z.ZodRawShape>(
	request: Request,
	shape: Shape
): Promise<z.infer<z.ZodObject<Shape>>> {
	const formData = await request.formData();
	const values: Record<string, string> = {};
	for (const [key, value] of formData) {
		if (typeof value === 'string') values[key] = value;
	}
	const parsed = z.object(shape).safeParse(values);
	if (!parsed.success) throw new DomainError('Check the form and try again');
	return parsed.data;
}
