import type { SubmitFunction } from '$app/forms';
import { refreshAll } from '$app/navigation';
import { failureMessage, postAction } from './actions.ts';
import { toasts } from './toasts.svelte.ts';

/** One undo stack for this browser session. Payloads come from the server. */
class UndoStack {
	#entries: unknown[] = $state([]);

	get canUndo(): boolean {
		return this.#entries.length > 0;
	}

	push(payload: unknown, message: string): void {
		if (payload === undefined || payload === null) return;
		this.#entries = [...this.#entries, payload];
		toasts.show(message, { action: { label: 'Undo', run: () => this.undo() } });
	}

	async undo(): Promise<void> {
		const payload = this.#entries.at(-1);
		if (payload === undefined) return;
		this.#entries = this.#entries.slice(0, -1);
		const error = failureMessage(await postAction('/?/undo', { payload: JSON.stringify(payload) }));
		if (error) toasts.error(error);
		await refreshAll();
	}
}

export const undoStack = new UndoStack();

/** use:enhance that records a server undo payload and shows an Undo toast. */
export function undoEnhance(message: string): SubmitFunction {
	return () => {
		return async ({ result, update }) => {
			const error = failureMessage(result);
			if (error) {
				toasts.error(error);
				return;
			}
			await update({ reset: false, navigate: false });
			const undo = result.type === 'success' ? result.data?.undo : undefined;
			undoStack.push(undo, message);
		};
	};
}
