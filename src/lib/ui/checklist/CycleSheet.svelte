<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet, openSheet } from '../../client/sheet-route.ts';
	import { isReceived, type Payday } from '../../domain/models.ts';
	import { formatEdit } from '../../domain/money.ts';
	import Sheet from '../overlay/Sheet.svelte';
	import ConfirmButton from './ConfirmButton.svelte';

	let {
		open,
		payday,
		unpaidCount,
		missingCount,
		issuesCount = 0
	}: {
		open: boolean;
		payday: Payday;
		unpaidCount: number;
		missingCount: number;
		issuesCount?: number;
	} = $props();

	const expected = new FormState();
	const payDate = new FormState();
	const note = new FormState();
	const finish = new FormState();
	const received = $derived(isReceived(payday));
	const finishHint = $derived.by(() => {
		const parts: string[] = [];
		if (unpaidCount > 0) parts.push(`${unpaidCount} not routed yet`);
		if (missingCount > 0) parts.push(`${missingCount} missing amounts`);
		return parts.length ? parts.join(', ') + '. Leftover will be kept.' : 'Leftover will be kept.';
	});
</script>

<Sheet {open} title="This payday" description={payday.title} closeHref="./" onclose={closeSheet}>
	<div class="sections">
		{#if !received}
			<form
				method="POST"
				action="?/expected"
				class="stack"
				use:enhance={expected.enhance({ success: 'Expected salary saved' })}
			>
				<input type="hidden" name="paydayId" value={payday.id} />
				<label class="field">
					<span>Expected salary</span>
					<input
						class="input money"
						name="salary"
						inputmode="decimal"
						autocomplete="off"
						value={payday.expectedAmount === null ? '' : formatEdit(payday.expectedAmount)}
					/>
				</label>
				{#if expected.error}<p class="form-error" role="alert">{expected.error}</p>{/if}
				<button class="button primary block" type="submit" disabled={expected.busy}
					>Save expected salary</button
				>
			</form>
		{/if}

		<form
			method="POST"
			action="?/payDate"
			class="stack"
			use:enhance={payDate.enhance({ success: 'Pay date saved' })}
		>
			<input type="hidden" name="paydayId" value={payday.id} />
			<label class="field">
				<span>Pay date</span>
				<input class="input" name="payDate" type="date" value={payday.payDate} />
			</label>
			{#if payDate.error}<p class="form-error" role="alert">{payDate.error}</p>{/if}
			<button class="button block" type="submit" disabled={payDate.busy}>Save pay date</button>
		</form>

		<form
			method="POST"
			action="?/note"
			class="stack"
			use:enhance={note.enhance({ success: 'Note saved' })}
		>
			<input type="hidden" name="paydayId" value={payday.id} />
			<label class="field">
				<span>Note</span>
				<textarea class="input" name="note" maxlength="280" rows="2">{payday.note ?? ''}</textarea>
			</label>
			{#if note.error}<p class="form-error" role="alert">{note.error}</p>{/if}
			<button class="button block" type="submit" disabled={note.busy}>Save note</button>
		</form>

		<p>
			<a href="?sheet=other">Add a one-off payday</a>
		</p>

		<div class="stack danger-zone">
			<p class="hint">{finishHint}</p>
			{#if issuesCount > 0}
				<button
					class="button danger block"
					type="button"
					onclick={() => void openSheet('finish-check', { replace: true })}
				>
					Finish payday
				</button>
			{:else}
				<ConfirmButton
					action="?/finish"
					fields={{ paydayId: payday.id }}
					confirm="Yes, finish it"
					onsubmit={finish.enhance({ success: 'Payday finished. It is in History.' })}
				>
					Finish payday
				</ConfirmButton>
			{/if}
			{#if finish.error}
				<p class="form-error" role="alert">{finish.error}</p>
			{/if}
		</div>
	</div>
</Sheet>

<style>
	.sections {
		display: grid;
		gap: var(--space-6);
	}

	.hint {
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	.danger-zone {
		padding-top: var(--space-5);
		border-top: 1px solid var(--border-subtle);
	}
</style>
