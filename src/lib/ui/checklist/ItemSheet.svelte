<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet, openSheet } from '../../client/sheet-route.ts';
	import type { Destination, RouteItem } from '../../domain/models.ts';
	import { formatEdit } from '../../domain/money.ts';
	import Icon from '../icons/Icon.svelte';
	import IconPicker from '../defaults/IconPicker.svelte';
	import Sheet from '../overlay/Sheet.svelte';
	import DecisionChips from './DecisionChips.svelte';
	import DestinationSelect from './DestinationSelect.svelte';

	let {
		item,
		destinations,
		ondelete
	}: {
		item: RouteItem | undefined;
		destinations: Destination[];
		ondelete: (item: RouteItem) => void;
	} = $props();

	const form = new FormState();
	let shown: RouteItem | undefined = $state();
	let title = $state('');
	let icon = $state<string | null>(null);
	$effect(() => {
		if (item) {
			shown = item;
			title = item.name;
			icon = item.icon;
		}
	});

	function remove() {
		if (!shown) return;
		const target = shown;
		closeSheet();
		ondelete(target);
	}

	function onKey(event: KeyboardEvent) {
		if (!shown || event.metaKey || event.ctrlKey || event.altKey) return;
		const target = event.target as HTMLElement;
		if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
			return;
		}
		const key = event.key.toLowerCase();
		if (key === 'f') document.getElementById(`decide-full-${shown.id}`)?.click();
		if (key === 'm') document.getElementById(`decide-min-${shown.id}`)?.click();
		if (key === 's') {
			event.preventDefault();
			void openSheet(`skip-${shown.id}`);
		}
		if (key === 'u') {
			event.preventDefault();
			void openSheet(`custom-${shown.id}`);
		}
	}
</script>

<svelte:window onkeydown={onKey} />

<Sheet
	open={item !== undefined}
	title={shown?.name ?? 'Item'}
	description="Route or edit this item."
	closeHref="./"
	onclose={closeSheet}
>
	{#if shown}
		<!-- Routing actions live here so Planned/To route cards stay drag-clean. -->
		<div class="decisions">
			<p class="route-label">Route</p>
			<DecisionChips item={shown} />
			<p class="hint">F full · M min · U custom · S skip</p>
		</div>
		<div class="stack">
			<form
				method="POST"
				action="?/update"
				class="stack"
				use:enhance={form.enhance({ success: 'Item saved' })}
			>
				<input type="hidden" name="itemId" value={shown.id} />
				<IconPicker bind:title bind:value={icon} />
				<label class="field">
					<span>Full amount</span>
					<input
						class="input money"
						name="amount"
						inputmode="decimal"
						autocomplete="off"
						value={shown.fullAmountExpr ?? ''}
					/>
				</label>
				<label class="field">
					<span>Minimum</span>
					<input
						class="input money"
						name="minimum"
						inputmode="decimal"
						autocomplete="off"
						value={shown.minimumAmount === null ? '' : formatEdit(shown.minimumAmount)}
					/>
				</label>
				<label class="field">
					<span>Due date</span>
					<input class="input" name="dueDate" type="date" value={shown.dueDate ?? ''} />
				</label>
				<DestinationSelect {destinations} value={shown.destinationId} />
				{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
				<button class="button primary block" type="submit" disabled={form.busy}>Save</button>
			</form>
			<button class="button danger block delete-action" type="button" onclick={remove}>
				<Icon name="trash" size={18} /> Delete
			</button>
		</div>
	{/if}
</Sheet>

<style>
	.decisions {
		margin: 0 0 var(--space-4);
		padding: 0 0 var(--space-4);
		border-bottom: 1px solid var(--border-subtle);
		display: grid;
		gap: var(--space-2);
	}

	.route-label {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-muted);
	}

	.decisions :global(.segmented) {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.375rem;
	}

	.decisions :global(.segmented form) {
		margin: 0;
		min-width: 0;
	}

	.decisions :global(.segment) {
		width: 100%;
		min-height: 2.5rem;
		padding: 0 0.35rem;
		border-radius: 0.75rem;
		border: 1px solid var(--border);
		background: var(--surface-sunken);
		font-size: 0.75rem;
		line-height: 1.1;
		white-space: nowrap;
	}

	.hint {
		margin: 0;
		color: var(--text-dim);
		font-size: var(--text-xs);
	}

	/* Outer .stack already gaps Save→Delete; keep Delete full-width on all viewports. */
	.delete-action {
		width: 100%;
		min-height: var(--tap);
	}
</style>
