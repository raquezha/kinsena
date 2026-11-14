import { refreshAll } from '$app/navigation';
import type { SubmitFunction } from '$app/forms';
import type { Cents, CycleItem } from '../domain/models.ts';
import { summarize, type CycleSummary } from '../domain/summary.ts';
import { failureMessage, postAction } from './actions.ts';
import { hide, NO_CHANGES, setPaid, settle, withPending } from './optimistic.ts';
import type { PendingChanges } from './optimistic.ts';
import { toasts } from './toasts.svelte.ts';

interface Source {
	items: () => CycleItem[];
	salary: () => Cents | null;
}

/**
 * The active checklist as the user sees it: server data plus changes
 * that are still on their way. Failed changes roll back with a toast.
 */
export class Checklist {
	#source: Source;
	pending: PendingChanges = $state(NO_CHANGES);
	readonly items: CycleItem[];
	readonly summary: CycleSummary;
	readonly unpaid: CycleItem[];
	readonly paid: CycleItem[];

	constructor(source: Source) {
		this.#source = source;
		this.items = $derived(withPending(this.#source.items(), this.pending));
		this.summary = $derived(summarize({ salary: this.#source.salary() }, this.items));
		this.unpaid = $derived(this.items.filter((item) => !item.isDone));
		this.paid = $derived(this.items.filter((item) => item.isDone));
	}

	#settle(id: number) {
		this.pending = settle(this.pending, id);
	}

	/** use:enhance handler for a row's paid checkbox form. */
	toggle(item: CycleItem): SubmitFunction {
		return () => {
			const paid = !item.isDone;
			this.pending = setPaid(this.pending, item.id, paid);
			return async ({ result, update }) => {
				const error = failureMessage(result);
				if (!error) await update({ reset: false, navigate: false });
				this.#settle(item.id);
				if (error) toasts.error(error);
				else if (paid) this.#offerUndoPaid(item);
			};
		};
	}

	#offerUndoPaid(item: CycleItem) {
		toasts.show(`${item.name} marked paid`, {
			action: { label: 'Undo', run: () => this.#send('?/toggle', { itemId: item.id }) }
		});
	}

	async remove(item: CycleItem): Promise<void> {
		this.pending = hide(this.pending, item.id);
		const result = await postAction('?/remove', { itemId: item.id });
		const error = failureMessage(result);
		if (!error) await refreshAll();
		this.#settle(item.id);
		if (error) {
			toasts.error(error);
			return;
		}
		const removed = result.type === 'success' ? result.data?.removed : undefined;
		toasts.show(`Deleted ${item.name}`, {
			action: { label: 'Undo', run: () => this.#send('?/restore', { ...removed }) }
		});
	}

	async #send(action: string, fields: Record<string, string | number | boolean>) {
		const error = failureMessage(await postAction(action, fields));
		if (error) toasts.error(error);
		await refreshAll();
	}
}
