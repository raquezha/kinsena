import { z } from 'zod';
import { CADENCES } from '../../domain/cadence.ts';
import { CURRENCY_CODES } from '../../domain/currency.ts';
import { DomainError } from '../../domain/errors.ts';
import { MAX_EXPRESSION_LENGTH } from '../../domain/amount-parser.ts';

const text = (max: number) =>
	z
		.string()
		.max(max * 4)
		.default('');

export const fields = {
	id: z.coerce.number().int().positive(),
	name: text(128),
	title: text(128),
	note: text(280),
	position: z.coerce.number().int().min(0).max(2_147_483_647),
	amount: z
		.string()
		.max(MAX_EXPRESSION_LENGTH * 2)
		.default(''),
	cadence: z.enum(CADENCES).default('ANY'),
	currency: z.enum(CURRENCY_CODES as [string, ...string[]]),
	flag: z.enum(['true', 'false']).transform((value) => value === 'true')
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
