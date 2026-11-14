<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import { CADENCE_LABELS } from '../../domain/cadence.ts';
	import type { TemplateItem } from '../../domain/models.ts';
	import { formatEdit } from '../../domain/money.ts';
	import ConfirmButton from '../checklist/ConfirmButton.svelte';
	import Sheet from '../overlay/Sheet.svelte';

	let { template }: { template: TemplateItem | undefined } = $props();

	const amount = new FormState();
	const archive = new FormState();
	let shown: TemplateItem | undefined = $state();
	$effect(() => {
		if (template) shown = template;
	});
</script>

<Sheet
	open={template !== undefined}
	title={shown?.name ?? 'Saved item'}
	description={shown ? CADENCE_LABELS[shown.cadence] : undefined}
	closeHref="/defaults"
	onclose={closeSheet}
>
	{#if shown}
		<div class="stack">
			<form
				method="POST"
				action="?/amount"
				class="stack"
				use:enhance={amount.enhance({ success: 'Default amount saved' })}
			>
				<input type="hidden" name="templateId" value={shown.id} />
				<label class="field">
					<span>Default amount</span>
					<input
						class="input money"
						name="amount"
						inputmode="decimal"
						autocomplete="off"
						value={shown.defaultAmount === null ? '' : formatEdit(shown.defaultAmount)}
					/>
					<small>Used for new cycles only. Past cycles keep their amounts.</small>
				</label>
				{#if amount.error}<p class="form-error" role="alert">{amount.error}</p>{/if}
				<button class="button primary block" type="submit" disabled={amount.busy}>Save</button>
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
