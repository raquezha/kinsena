<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import { DESTINATION_KIND_LABELS, DESTINATION_KINDS } from '../../domain/destination.ts';
	import type { Destination } from '../../domain/models.ts';
	import ConfirmButton from '../checklist/ConfirmButton.svelte';
	import Sheet from '../overlay/Sheet.svelte';

	let { destination }: { destination: Destination | undefined } = $props();
	const form = new FormState();
	const archive = new FormState();
	let shown: Destination | undefined = $state();
	$effect(() => {
		if (destination) shown = destination;
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
					<input class="input" name="name" required maxlength="128" value={shown.name} />
				</label>
				<label class="field">
					<span>Kind</span>
					<select class="input" name="kind">
						{#each DESTINATION_KINDS as kind (kind)}
							<option value={kind} selected={kind === shown.kind}
								>{DESTINATION_KIND_LABELS[kind]}</option
							>
						{/each}
					</select>
				</label>
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
