<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { Payday } from '../../domain/models.ts';
	import { formatEdit, formatMoney } from '../../domain/money.ts';
	import Sheet from '../overlay/Sheet.svelte';

	let { open, payday, currency }: { open: boolean; payday: Payday; currency: CurrencyCode } =
		$props();

	const form = new FormState();
</script>

<Sheet
	{open}
	title="Salary in"
	description="Confirm what arrived for {payday.title}."
	closeHref="./"
	onclose={closeSheet}
>
	<form
		method="POST"
		action="?/receive"
		class="stack"
		use:enhance={form.enhance({ success: 'Salary marked as received' })}
	>
		<input type="hidden" name="paydayId" value={payday.id} />
		<label class="field">
			<span>Amount received</span>
			<input
				class="input money"
				name="salary"
				inputmode="decimal"
				autocomplete="off"
				value={payday.expectedAmount === null ? '' : formatEdit(payday.expectedAmount)}
			/>
			<small>
				{#if payday.expectedAmount !== null}
					Expected {formatMoney(payday.expectedAmount, currency)}. Leave as is to confirm it.
				{:else}
					Enter the salary that arrived.
				{/if}
			</small>
		</label>
		{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
		<button class="button primary block" type="submit" disabled={form.busy}>Mark received</button>
	</form>
</Sheet>
