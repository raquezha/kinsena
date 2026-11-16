<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import { FUND_FROM_LABELS, FUND_FROMS } from '../../domain/fund-from.ts';
	import type { Destination, TemplateItem } from '../../domain/models.ts';
	import { formatEdit } from '../../domain/money.ts';
	import ConfirmButton from '../checklist/ConfirmButton.svelte';
	import DestinationSelect from '../checklist/DestinationSelect.svelte';
	import Sheet from '../overlay/Sheet.svelte';
	import ChoiceGroup from '../forms/ChoiceGroup.svelte';
	import IconPicker from './IconPicker.svelte';

	let {
		template,
		destinations
	}: { template: TemplateItem | undefined; destinations: Destination[] } = $props();

	const form = new FormState();
	const archive = new FormState();
	let shown: TemplateItem | undefined = $state();
	let title = $state('');
	let icon = $state<string | null>(null);
	$effect(() => {
		if (template) {
			shown = template;
			title = template.name;
			icon = template.icon;
		}
	});
</script>

<Sheet
	open={template !== undefined}
	title={shown?.name ?? 'Saved item'}
	description={shown ? FUND_FROM_LABELS[shown.fundFrom] : undefined}
	closeHref="/defaults"
	onclose={closeSheet}
>
	{#if shown}
		<div class="stack">
			<form
				method="POST"
				action="?/update"
				class="stack"
				use:enhance={form.enhance({ success: 'Saved item updated' })}
			>
				<input type="hidden" name="templateId" value={shown.id} />
				<IconPicker bind:title bind:value={icon} />
				<label class="field">
					<span>Default amount</span>
					<input
						class="input money"
						name="amount"
						inputmode="decimal"
						autocomplete="off"
						value={shown.defaultAmount === null ? '' : formatEdit(shown.defaultAmount)}
					/>
				</label>
				<label class="field">
					<span>Minimum</span>
					<input
						class="input money"
						name="minimum"
						inputmode="decimal"
						autocomplete="off"
						value={shown.minimumAmount === null ? '' : formatEdit(shown.minimumAmount)}
					/>
				</label>
				<label class="field">
					<span>Due day of month</span>
					<input
						class="input"
						name="dueDay"
						inputmode="numeric"
						maxlength="2"
						value={shown.dueDay ?? ''}
					/>
				</label>
				<label class="field">
					<span>Installments (optional)</span>
					<input
						class="input"
						name="installmentCount"
						inputmode="numeric"
						maxlength="3"
						value={shown.installmentCount ?? ''}
					/>
					{#if shown.installmentCount !== null}
						<small>{shown.installmentsCompleted} of {shown.installmentCount} paid</small>
					{:else}
						<small>Fixed N payments of that amount. Leave blank for a normal recurring item.</small>
					{/if}
				</label>
				<ChoiceGroup
					name="fundFrom"
					legend="Fund from"
					value={shown.fundFrom}
					options={FUND_FROMS.map((value) => ({
						value,
						label: FUND_FROM_LABELS[value]
					}))}
				/>
				<DestinationSelect {destinations} value={shown.destinationId} />
				{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
				<button class="button primary block" type="submit" disabled={form.busy}>Save</button>
			</form>
			<ConfirmButton
				action="?/archive"
				fields={{ templateId: shown.id }}
				confirm="Yes, remove it"
				tone="danger"
				onsubmit={archive.enhance({ success: 'Saved item removed' })}
			>
				Remove from defaults
			</ConfirmButton>
			{#if archive.error}<p class="form-error" role="alert">{archive.error}</p>{/if}
		</div>
	{/if}
</Sheet>
