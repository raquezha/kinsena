import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import type { z } from 'zod';
import { DomainError } from '../../domain/errors.ts';
import type { Services } from '../container.ts';
import { readForm } from './forms.ts';

export interface ActionError {
	error: string;
}

/** Runs a use case and turns rule violations into a 400 the page can show. */
export async function attempt<T>(
	work: () => T | Promise<T>
): Promise<T | ActionFailure<ActionError>> {
	try {
		return await work();
	} catch (error) {
		if (error instanceof DomainError) return fail(400, { error: error.message });
		throw error;
	}
}

/** Builds a form action: validate the fields, then run one use case. */
export function formAction<Shape extends z.ZodRawShape, T>(
	shape: Shape,
	run: (form: z.infer<z.ZodObject<Shape>>, services: Services) => T
) {
	return ({ request, locals }: Pick<RequestEvent, 'request' | 'locals'>) =>
		attempt(async () => run(await readForm(request, shape), locals.services));
}
