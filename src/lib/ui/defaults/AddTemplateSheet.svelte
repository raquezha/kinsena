<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import { CADENCE_LABELS, CADENCES } from '../../domain/cadence.ts';
	import Sheet from '../overlay/Sheet.svelte';

	let { open }: { open: boolean } = $props();
	const form = new FormState();
</script>

<Sheet
	{open}
	title="New saved item"
	description="Copied into every new cycle that matches."
	closeHref="/defaults"
	onclose={closeSheet}
>
	<form method="POST" action="?/add" class="stack" use:enhance={form.enhance({ success: 'Saved' })}>
		<label class="field">
			<span>Name</span>
			<input class="input" name="name" required maxlength="128" autocomplete="off" />
		</label>
		<label class="field">
			<span>Default amount</span>
			<input class="input money" name="amount" inputmode="decimal" autocomplete="off" />
			<small>Leave blank for bills that change every time.</small>
		</label>
		<label class="field">
			<span>When</span>
			<select class="input" name="cadence">
				{#each CADENCES as cadence (cadence)}
					<option value={cadence}>{CADENCE_LABELS[cadence]}</option>
				{/each}
			</select>
		</label>
		{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
		<button class="button primary block" type="submit" disabled={form.busy}>Save item</button>
	</form>
</Sheet>
