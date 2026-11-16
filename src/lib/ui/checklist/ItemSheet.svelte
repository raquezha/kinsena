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
	description="Edit this item."
	closeHref="./"
	onclose={closeSheet}
>
	{#if shown}
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
		<div class="decisions">
			<DecisionChips item={shown} />
			<p class="hint">F full · M min · U custom · S skip</p>
		</div>
		<button class="button danger block" type="button" onclick={remove}>
			<Icon name="trash" size={18} /> Delete
		</button>
	{/if}
</Sheet>

<style>
	.decisions {
		margin: var(--space-4) 0;
		padding: var(--space-4) 0;
		border-top: 1px solid var(--border-subtle);
		border-bottom: 1px solid var(--border-subtle);
	}

	.hint {
		margin-top: var(--space-2);
		color: var(--text-dim);
		font-size: var(--text-xs);
	}
</style>
