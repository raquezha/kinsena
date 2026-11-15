import type { SubmitFunction } from '$app/forms';
import { failureMessage } from './actions.ts';
import { closeSheet } from './sheet-route.ts';
import { toasts } from './toasts.svelte.ts';
import { undoStack } from './undo.svelte.ts';

interface Options {
	/** Toast shown after a successful save. */
	success?: string;
	/** Close the open sheet after success (default true). */
	close?: boolean;
	onsuccess?: () => void;
}

/** Busy and error state for one enhanced form, with save-close-toast on success. */
export class FormState {
	busy = $state(false);
	error: string | null = $state(null);

	enhance(options: Options = {}): SubmitFunction {
		return () => {
			this.busy = true;
			this.error = null;
			return async ({ result, update }) => {
				this.error = failureMessage(result);
				if (!this.error) {
					await update({ reset: true, navigate: false });
					if (options.close !== false) closeSheet();
					if (options.success) {
						const undo = result.type === 'success' ? result.data?.undo : undefined;
						if (undo) undoStack.push(undo, options.success);
						else toasts.show(options.success);
					}
					options.onsuccess?.();
				}
				this.busy = false;
			};
		};
	}
}
