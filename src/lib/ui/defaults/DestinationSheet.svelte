<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import { DESTINATION_KIND_LABELS, DESTINATION_KINDS } from '../../domain/destination.ts';
	import type { Destination } from '../../domain/models.ts';
	import ConfirmButton from '../checklist/ConfirmButton.svelte';
	import Sheet from '../overlay/Sheet.svelte';
	import ChoiceGroup from '../forms/ChoiceGroup.svelte';
	import DestinationBrandPreview from './DestinationBrandPreview.svelte';

	let { destination }: { destination: Destination | undefined } = $props();
	const form = new FormState();
	const archive = new FormState();
	let shown: Destination | undefined = $state();
	let name = $state('');
	$effect(() => {
		if (destination) {
			shown = destination;
			name = destination.name;
		}
	});
</script>

<Sheet
	open={destination !== undefined}
	title={shown?.name ?? 'Destination'}
	closeHref="/defaults"
	onclose={closeSheet}
>
	{#if shown}
		<div class="stack">
			<form
				method="POST"
				action="?/updateDestination"
				class="stack"
				use:enhance={form.enhance({ success: 'Destination saved' })}
			>
				<input type="hidden" name="destinationId" value={shown.id} />
				<label class="field">
					<span>Name</span>
					<span class="name-row">
						<input class="input" name="name" required maxlength="128" bind:value={name} />
						<DestinationBrandPreview {name} />
					</span>
				</label>
				<ChoiceGroup
					name="kind"
					legend="Kind"
					value={shown.kind}
					options={DESTINATION_KINDS.map((kind) => ({
						value: kind,
						label: DESTINATION_KIND_LABELS[kind]
					}))}
				/>
				{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
				<button class="button primary block" type="submit" disabled={form.busy}>Save</button>
			</form>
			<ConfirmButton
				action="?/archiveDestination"
				fields={{ destinationId: shown.id }}
				confirm="Yes, remove it"
				tone="danger"
				onsubmit={archive.enhance({ success: 'Destination removed' })}
			>
				Remove destination
			</ConfirmButton>
			{#if archive.error}<p class="form-error" role="alert">{archive.error}</p>{/if}
		</div>
	{/if}
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
