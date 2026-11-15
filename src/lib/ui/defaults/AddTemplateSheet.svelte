<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import { FUND_FROM_LABELS, FUND_FROMS } from '../../domain/fund-from.ts';
	import type { Destination } from '../../domain/models.ts';
	import DestinationSelect from '../checklist/DestinationSelect.svelte';
	import Sheet from '../overlay/Sheet.svelte';
	import ChoiceGroup from '../forms/ChoiceGroup.svelte';

	let { open, destinations }: { open: boolean; destinations: Destination[] } = $props();
	const form = new FormState();
</script>

<Sheet
	{open}
	title="New saved item"
	description="Copied into upcoming paydays that match this rule."
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
			<span>Minimum</span>
			<input class="input money" name="minimum" inputmode="decimal" autocomplete="off" />
		</label>
		<label class="field">
			<span>Due day of month</span>
			<input class="input" name="dueDay" inputmode="numeric" maxlength="2" placeholder="e.g. 20" />
		</label>
		<ChoiceGroup
			name="fundFrom"
			legend="Fund from"
			value="EVERY"
			options={FUND_FROMS.map((value) => ({
				value,
				label: FUND_FROM_LABELS[value]
			}))}
		/>
		<DestinationSelect {destinations} />
		<label class="option">
			<input type="hidden" name="applyToOpen" value="false" />
			<input type="checkbox" name="applyToOpen" value="true" checked />
			Add to open paydays if missing
		</label>
		{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
		<button class="button primary block" type="submit" disabled={form.busy}>Save item</button>
	</form>
</Sheet>

<style>
	.option {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-muted);
		line-height: 1.4;
	}

	.option input[type='checkbox'] {
		margin-top: 0.2rem;
	}
</style>
