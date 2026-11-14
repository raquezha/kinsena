<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Checklist } from '../../client/checklist.svelte.ts';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { CycleItem } from '../../domain/models.ts';
	import { formatMoney } from '../../domain/money.ts';
	import Icon from '../icons/Icon.svelte';
	import Sheet from '../overlay/Sheet.svelte';

	let {
		item,
		checklist,
		currency
	}: { item: CycleItem | undefined; checklist: Checklist; currency: CurrencyCode } = $props();

	const form = new FormState();
	// Keep showing the last item while the sheet animates closed.
	let shown: CycleItem | undefined = $state();
	$effect(() => {
		if (item) shown = item;
	});

	function remove() {
		if (!shown) return;
		const target = shown;
		closeSheet();
		void checklist.remove(target);
	}
</script>

<Sheet
	open={item !== undefined}
	title={shown?.name ?? 'Item'}
	description={shown?.isDone ? 'Paid' : shown ? `Now ${formatMoney(shown.amount, currency)}` : ''}
	closeHref="/"
	onclose={closeSheet}
>
	{#if shown}
		<form
			method="POST"
			action="?/amount"
			class="stack"
			use:enhance={form.enhance({ success: 'Amount saved' })}
		>
			<input type="hidden" name="itemId" value={shown.id} />
			<label class="field">
				<span>Amount</span>
				<input
					class="input money"
					name="amount"
					inputmode="decimal"
					autocomplete="off"
					value={shown.amountExpr ?? ''}
				/>
				<small>Blank means unknown. 0 means nothing to pay. Sums like 10,538.91 + 3403 work.</small>
			</label>
			{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
			<button class="button primary block" type="submit" disabled={form.busy}>Save amount</button>
		</form>
		<div class="actions">
			<form method="POST" action="?/toggle" use:enhance={checklist.toggle(shown)}>
				<input type="hidden" name="itemId" value={shown.id} />
				<button class="button block" type="submit" onclick={closeSheet}>
					<Icon name="check" size={18} />
					{shown.isDone ? 'Mark unpaid' : 'Mark paid'}
				</button>
			</form>
			<form method="POST" action="?/remove">
				<input type="hidden" name="itemId" value={shown.id} />
				<button
					class="button danger block"
					type="submit"
					onclick={(event) => {
						event.preventDefault();
						remove();
					}}
				>
					<Icon name="trash" size={18} /> Delete
				</button>
			</form>
		</div>
	{/if}
</Sheet>

<style>
	.actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
		margin-top: var(--space-4);
		padding-top: var(--space-4);
		border-top: 1px solid var(--border-subtle);
	}
</style>
