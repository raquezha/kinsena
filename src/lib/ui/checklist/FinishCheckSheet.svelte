<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import { undoEnhance } from '../../client/undo.svelte.ts';
	import type { FinishIssue } from '../../domain/finish.ts';
	import Sheet from '../overlay/Sheet.svelte';
	import ConfirmButton from './ConfirmButton.svelte';

	let {
		open,
		paydayId,
		issues
	}: {
		open: boolean;
		paydayId: number;
		issues: FinishIssue[];
	} = $props();

	const finish = new FormState();

	function kindLabel(kind: FinishIssue['kind']): string {
		if (kind === 'pending') return 'No decision yet';
		if (kind === 'undone') return 'Decided, not marked routed';
		return 'Skipped, still on this payday';
	}
</script>

<Sheet
	{open}
	title="Before you finish"
	description="These items are still open. Move them, keep them here, or finish anyway."
	closeHref="./"
	onclose={closeSheet}
>
	<ul class="issues">
		{#each issues as issue (issue.itemId)}
			<li class="issue">
				<div>
					<strong>{issue.name}</strong>
					<p class="kind">{kindLabel(issue.kind)}</p>
				</div>
				<div class="actions">
					{#if issue.kind !== 'skipped'}
						<form method="POST" action="?/skip" use:enhance={undoEnhance('Kept on this payday')}>
							<input type="hidden" name="itemId" value={issue.itemId} />
							<input type="hidden" name="moveToNext" value="false" />
							<button class="button" type="submit">Mark kept</button>
						</form>
					{/if}
					<form method="POST" action="?/skip" use:enhance={undoEnhance('Moved to the next payday')}>
						<input type="hidden" name="itemId" value={issue.itemId} />
						<input type="hidden" name="moveToNext" value="true" />
						<button class="button" type="submit">Move to next payday</button>
					</form>
				</div>
			</li>
		{/each}
	</ul>
	<div class="stack">
		<ConfirmButton
			action="?/finish"
			fields={{ paydayId }}
			confirm="Yes, finish anyway"
			onsubmit={finish.enhance({ success: 'Payday finished. It is in History.' })}
		>
			Finish anyway
		</ConfirmButton>
		{#if finish.error}
			<p class="form-error" role="alert">{finish.error}</p>
		{/if}
	</div>
</Sheet>

<style>
	.issues {
		list-style: none;
		margin: 0 0 var(--space-5);
		padding: 0;
		display: grid;
		gap: var(--space-4);
	}

	.issue {
		display: grid;
		gap: var(--space-2);
	}

	.kind {
		margin: var(--space-1) 0 0;
		color: var(--text-dim);
		font-size: var(--text-sm);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
</style>
