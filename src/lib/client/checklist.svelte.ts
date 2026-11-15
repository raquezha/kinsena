import { refreshAll } from '$app/navigation';
import type { SubmitFunction } from '$app/forms';
import type { Payday, RouteItem } from '../domain/models.ts';
import { isReceived } from '../domain/models.ts';
import { summarize, type PaydaySummary } from '../domain/summary.ts';
import { failureMessage, postAction } from './actions.ts';
import { hide, NO_CHANGES, setPaid, settle, withPending } from './optimistic.ts';
import type { PendingChanges } from './optimistic.ts';
import { toasts } from './toasts.svelte.ts';

interface Source {
	items: () => RouteItem[];
	payday: () => Payday;
}

/**
 * The active checklist as the user sees it: server data plus changes
 * that are still on their way. Failed changes roll back with a toast.
 */
export class Checklist {
	#source: Source;
	pending: PendingChanges = $state(NO_CHANGES);
	readonly items: RouteItem[];
	readonly summary: PaydaySummary;
	readonly unpaid: RouteItem[];
	readonly paid: RouteItem[];
	readonly skipped: RouteItem[];
	readonly routing: boolean;

	constructor(source: Source) {
		this.#source = source;
		this.items = $derived(withPending(this.#source.items(), this.pending));
		this.summary = $derived(summarize(this.#source.payday(), this.items));
		this.unpaid = $derived(
			this.items.filter((item) => !item.isDone && item.decision !== 'SKIPPED')
		);
		this.paid = $derived(this.items.filter((item) => item.isDone && item.decision !== 'SKIPPED'));
		this.skipped = $derived(this.items.filter((item) => item.decision === 'SKIPPED'));
		this.routing = $derived(isReceived(this.#source.payday()));
	}

	#settle(id: number) {
		this.pending = settle(this.pending, id);
	}

	/** use:enhance handler for a row's done checkbox form. */
	toggle(item: RouteItem): SubmitFunction {
		return () => {
			const done = !item.isDone;
			this.pending = setPaid(this.pending, item.id, done);
			return async ({ result, update }) => {
				const error = failureMessage(result);
				if (!error) await update({ reset: false, navigate: false });
				this.#settle(item.id);
				if (error) toasts.error(error);
				else if (done) this.#offerUndoDone(item);
			};
		};
	}

	#offerUndoDone(item: RouteItem) {
		toasts.show(`${item.name} routed`, {
			action: { label: 'Undo', run: () => this.#send('?/toggle', { itemId: item.id }) }
		});
	}

	async remove(item: RouteItem): Promise<void> {
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

	async #send(action: string, fields: Record<string, string | number | boolean | null>) {
		const error = failureMessage(await postAction(action, fields));
		if (error) toasts.error(error);
		await refreshAll();
	}
}
