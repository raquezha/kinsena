import { refreshAll } from '$app/navigation';
import type { SubmitFunction } from '$app/forms';
import type { Payday, RouteItem } from '../domain/models.ts';
import { isReceived } from '../domain/models.ts';
import { summarize, type PaydaySummary } from '../domain/summary.ts';
import { failureMessage, postAction } from './actions.ts';
import {
	clearOrder,
	hide,
	NO_CHANGES,
	setOrder,
	setPaid,
	settle,
	withPending
} from './optimistic.ts';
import type { PendingChanges } from './optimistic.ts';
import { toasts } from './toasts.svelte.ts';
import { undoStack } from './undo.svelte.ts';

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
				else {
					const undo = result.type === 'success' ? result.data?.undo : undefined;
					undoStack.push(undo, done ? `${item.name} routed` : `${item.name} unmarked`);
				}
			};
		};
	}

	async remove(item: RouteItem): Promise<void> {
		this.pending = hide(this.pending, item.id);
		const result = await postAction('?/remove', { itemId: item.id });
		const error = failureMessage(result);
		if (!error) {
			await refreshAll();
			// Server list is authoritative after refresh — drop client order overlay.
			this.pending = clearOrder(this.pending);
		}
		this.#settle(item.id);
		if (error) {
			toasts.error(error);
			return;
		}
		const undo = result.type === 'success' ? result.data?.undo : undefined;
		undoStack.push(undo, `Deleted ${item.name}`);
	}

	/** Keep open-item rank after a saved drag without remounting the page. */
	applyOrder(orderedOpenIds: readonly number[]): void {
		this.pending = setOrder(this.pending, orderedOpenIds);
	}
}
