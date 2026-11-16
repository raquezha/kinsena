<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import { DESTINATION_KIND_LABELS, DESTINATION_KINDS } from '../../domain/destination.ts';
	import Sheet from '../overlay/Sheet.svelte';
	import ChoiceGroup from '../forms/ChoiceGroup.svelte';
	import DestinationBrandPreview from './DestinationBrandPreview.svelte';

	let { open }: { open: boolean } = $props();
	const form = new FormState();
	let name = $state('');
	$effect(() => {
		if (open) name = '';
	});
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
			<span class="name-row">
				<input
					class="input"
					name="name"
					required
					maxlength="128"
					autocomplete="off"
					bind:value={name}
				/>
				<DestinationBrandPreview {name} />
			</span>
		</label>
		<ChoiceGroup
			name="kind"
			legend="Kind"
			value="ACCOUNT"
			options={DESTINATION_KINDS.map((kind) => ({
				value: kind,
				label: DESTINATION_KIND_LABELS[kind]
			}))}
		/>
		{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
		<button class="button primary block" type="submit" disabled={form.busy}>Save destination</button
		>
	</form>
</Sheet>

<style>
	.name-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.name-row .input {
		flex: 1;
		min-width: 0;
	}
</style>
