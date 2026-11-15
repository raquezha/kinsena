<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import Sheet from '../overlay/Sheet.svelte';

	let { open }: { open: boolean } = $props();
	const form = new FormState();
</script>

<Sheet
	{open}
	title="New payday"
	description="A one-off payday, such as a bonus, on a date you choose."
	closeHref="./"
	onclose={closeSheet}
>
	<form
		method="POST"
		action="?/other"
		class="stack"
		use:enhance={form.enhance({ success: 'Payday added' })}
	>
		<label class="field">
			<span>Title</span>
			<input class="input" name="title" maxlength="128" placeholder="e.g. Mid-year bonus" />
			<small>Leave blank to use the date.</small>
		</label>
		<label class="field">
			<span>Date</span>
			<input class="input" name="date" type="date" required />
		</label>
		<label class="field">
			<span>Expected salary <em>(optional)</em></span>
			<input class="input money" name="salary" inputmode="decimal" autocomplete="off" />
		</label>
		{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
		<button class="button primary block" type="submit" disabled={form.busy}>Create payday</button>
	</form>
</Sheet>
