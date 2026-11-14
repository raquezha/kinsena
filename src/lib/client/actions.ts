import { deserialize, type ActionResult } from '$app/forms';

/** Calls a form action from code (undo, swipe), the same way use:enhance does. */
export async function postAction(
	action: string,
	fields: Record<string, string | number | boolean>
): Promise<ActionResult> {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) body.set(key, String(value));
	try {
		const response = await fetch(action, {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
		return deserialize(await response.text());
	} catch {
		return { type: 'error', error: { status: 0, message: 'You seem to be offline' } };
	}
}

/** The message to show for anything other than a success. */
export function failureMessage(result: ActionResult): string | null {
	if (result.type === 'success' || result.type === 'redirect') return null;
	if (result.type === 'failure') {
		const error: unknown = result.data?.error;
		return typeof error === 'string' ? error : 'Could not save. Try again.';
	}
	return result.error.message || 'Something went wrong';
}
