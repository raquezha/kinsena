<script lang="ts">
	import { enhance } from '$app/forms';
	import { closeSheet } from '../../client/sheet-route.ts';
	import { FormState } from '../../client/form-state.svelte.ts';
	import Sheet from '../overlay/Sheet.svelte';

	let { open, cycleId }: { open: boolean; cycleId: number } = $props();
	const form = new FormState();
</script>

<Sheet
	{open}
	title="Add an item"
	description="Just for this payday."
	closeHref="/"
	onclose={closeSheet}
>
	<form
		method="POST"
		action="?/add"
		class="stack"
		use:enhance={form.enhance({ success: 'Item added' })}
	>
		<input type="hidden" name="cycleId" value={cycleId} />
		<label class="field">
			<span>Name</span>
			<input class="input" name="name" required maxlength="128" autocomplete="off" />
		</label>
		<label class="field">
			<span>Amount</span>
			<input class="input money" name="amount" inputmode="decimal" autocomplete="off" />
			<small>Leave blank if you don't know yet. Sums like 1,200 + 350 work too.</small>
		</label>
		{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
		<button class="button primary block" type="submit" disabled={form.busy}>Add item</button>
	</form>
</Sheet>
