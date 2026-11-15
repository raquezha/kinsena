<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import { DESTINATION_KIND_LABELS, DESTINATION_KINDS } from '../../domain/destination.ts';
	import Sheet from '../overlay/Sheet.svelte';

	let { open }: { open: boolean } = $props();
	const form = new FormState();
</script>

<Sheet
	{open}
	title="New destination"
	description="A bank account or biller you route salary to."
	closeHref="/defaults"
	onclose={closeSheet}
>
	<form
		method="POST"
		action="?/addDestination"
		class="stack"
		use:enhance={form.enhance({ success: 'Destination saved' })}
	>
		<label class="field">
			<span>Name</span>
			<input class="input" name="name" required maxlength="128" autocomplete="off" />
		</label>
		<label class="field">
			<span>Kind</span>
			<select class="input" name="kind">
				{#each DESTINATION_KINDS as kind (kind)}
					<option value={kind}>{DESTINATION_KIND_LABELS[kind]}</option>
				{/each}
			</select>
		</label>
		{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
		<button class="button primary block" type="submit" disabled={form.busy}>Save destination</button
		>
	</form>
</Sheet>
