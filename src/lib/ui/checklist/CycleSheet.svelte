<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import type { Cycle } from '../../domain/models.ts';
	import { formatEdit } from '../../domain/money.ts';
	import Sheet from '../overlay/Sheet.svelte';
	import ConfirmButton from './ConfirmButton.svelte';

	let { open, cycle, itemCount }: { open: boolean; cycle: Cycle; itemCount: number } = $props();

	const salary = new FormState();
	const note = new FormState();
	const finish = new FormState();
	const clear = new FormState();
</script>

<Sheet {open} title="This payday" description={cycle.title} closeHref="/" onclose={closeSheet}>
	<div class="sections">
		<form
			method="POST"
			action="?/salary"
			class="stack"
			use:enhance={salary.enhance({ success: 'Salary saved' })}
		>
			<input type="hidden" name="cycleId" value={cycle.id} />
			<label class="field">
				<span>Salary</span>
				<input
					class="input money"
					name="salary"
					inputmode="decimal"
					autocomplete="off"
					value={cycle.salary === null ? '' : formatEdit(cycle.salary)}
				/>
				<small>Leftover is salary minus every item, paid or not.</small>
			</label>
			{#if salary.error}<p class="form-error" role="alert">{salary.error}</p>{/if}
			<button class="button primary block" type="submit" disabled={salary.busy}>Save salary</button>
		</form>

		<form
			method="POST"
			action="?/note"
			class="stack"
			use:enhance={note.enhance({ success: 'Note saved' })}
		>
			<input type="hidden" name="cycleId" value={cycle.id} />
			<label class="field">
				<span>Note</span>
				<textarea class="input" name="note" maxlength="280" rows="2">{cycle.note ?? ''}</textarea>
			</label>
			{#if note.error}<p class="form-error" role="alert">{note.error}</p>{/if}
			<button class="button block" type="submit" disabled={note.busy}>Save note</button>
		</form>

		<div class="stack danger-zone">
			<ConfirmButton
				action="?/finish"
				fields={{ cycleId: cycle.id }}
				confirm="Yes, finish it"
				onsubmit={finish.enhance({ success: 'Cycle finished. It is in History.' })}
			>
				Finish payday cycle
			</ConfirmButton>
			{#if itemCount > 0}
				<ConfirmButton
					action="?/clear"
					fields={{ cycleId: cycle.id }}
					confirm="Yes, remove all {itemCount}"
					tone="danger"
					onsubmit={clear.enhance({ success: 'List cleared' })}
				>
					Clear list
				</ConfirmButton>
			{/if}
			{#if finish.error || clear.error}
				<p class="form-error" role="alert">{finish.error ?? clear.error}</p>
			{/if}
		</div>
	</div>
</Sheet>

<style>
	.sections {
		display: grid;
		gap: var(--space-6);
	}

	.danger-zone {
		padding-top: var(--space-5);
		border-top: 1px solid var(--border-subtle);
	}
</style>
