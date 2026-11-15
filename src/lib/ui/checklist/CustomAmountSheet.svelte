<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import type { RouteItem } from '../../domain/models.ts';
	import { formatEdit } from '../../domain/money.ts';
	import Sheet from '../overlay/Sheet.svelte';

	let { item }: { item: RouteItem | undefined } = $props();

	const form = new FormState();
	let shown: RouteItem | undefined = $state();
	$effect(() => {
		if (item) shown = item;
	});
</script>

<Sheet
	open={item !== undefined}
	title="Custom amount"
	description={shown ? `How much of this payday goes to ${shown.name}?` : ''}
	closeHref="./"
	onclose={closeSheet}
>
	{#if shown}
		<form
			method="POST"
			action="?/decide"
			class="stack"
			use:enhance={form.enhance({ success: 'Custom amount saved' })}
		>
			<input type="hidden" name="itemId" value={shown.id} />
			<input type="hidden" name="decision" value="CUSTOM" />
			<label class="field">
				<span>Amount</span>
				<input
					class="input money"
					name="amount"
					inputmode="decimal"
					autocomplete="off"
					value={shown.chosenAmount ? formatEdit(shown.chosenAmount) : ''}
				/>
			</label>
			{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
			<button class="button primary block" type="submit" disabled={form.busy}>Save</button>
		</form>
	{/if}
</Sheet>
