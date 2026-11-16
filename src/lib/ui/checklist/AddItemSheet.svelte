<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import type { Destination } from '../../domain/models.ts';
	import IconPicker from '../defaults/IconPicker.svelte';
	import Sheet from '../overlay/Sheet.svelte';
	import DestinationSelect from './DestinationSelect.svelte';

	let {
		open,
		paydayId,
		destinations
	}: { open: boolean; paydayId: number; destinations: Destination[] } = $props();

	const form = new FormState();
	let title = $state('');
	let icon = $state<string | null>(null);
	$effect(() => {
		if (open) {
			title = '';
			icon = null;
		}
	});
</script>

<Sheet
	{open}
	title="Add an item"
	description="A bill, statement, or transfer."
	closeHref="./"
	onclose={closeSheet}
>
	<form
		method="POST"
		action="?/add"
		class="stack"
		use:enhance={form.enhance({ success: 'Item added' })}
	>
		<input type="hidden" name="paydayId" value={paydayId} />
		<IconPicker bind:title bind:value={icon} />
		<label class="field">
			<span>Full amount</span>
			<input class="input money" name="amount" inputmode="decimal" autocomplete="off" />
			<small>Leave blank if the statement is not in yet. Sums like 10,538.91 + 3403 work.</small>
		</label>
		<label class="field">
			<span>Minimum <em>(optional)</em></span>
			<input class="input money" name="minimum" inputmode="decimal" autocomplete="off" />
		</label>
		<label class="field">
			<span>Due date</span>
			<input class="input" name="dueDate" type="date" />
		</label>
		<DestinationSelect {destinations} />
		{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
		<button class="button primary block" type="submit" disabled={form.busy}>Add item</button>
	</form>
</Sheet>
